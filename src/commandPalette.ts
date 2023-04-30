import { type Disposable, type ExtensionContext } from 'vscode';
import { type CommandId } from './commands';
import { $config, Constants } from './extension';
import { type TopLevelCommands } from './types';
import { extUtils } from './utils/extUtils';
import { vscodeUtils } from './utils/vscodeUtils';
import { getWorkspaceId, isWorkspaceCommandItem, WorkspaceConstants } from './workspaceCommands';

const commandPaletteCommandsList: Disposable[] = [];
/**
 * Command format in `package.json`.
 */
interface Command {
	command: string;
	title: string;
	category?: string;
	enablement: string;
}
interface CommandPalette {
	command: string;
	when: string;
}
/**
 * Commands this extension contributes in **commands** section of `package.json`
 */
const coreCommandIds: string[] = [
	'commands.openAsQuickPick',
	'commands.selectAndRun',
	'commands.rerun',
	'commands.suggestCommands',
	'commands.suggestCodicons',
	'commands.suggestVariables',
	'commands.newCommand',
	'commands.deleteCommand',
	'commands.newFolder',
	'commands.newCommandInFolder',
	'commands.newFolderInFolder',
	'commands.revealCommand',
	'commands.assignKeybinding',
	'commands.addToStatusBar',
	'commands.revealCommandsInSettignsGUI',
	'commands.escapeCommandUriArgument',
	'commands.run',
] satisfies `${CommandId}`[];
/**
 * VSCode doesn't support dynamic Command Palette items: https://github.com/microsoft/vscode/issues/1422
 *
 * This function updates `package.json` file to add items from `commands.commands` to Command Palette (but requires editor reload after changing configuration)
 */
export async function updateCommandPalette(items: TopLevelCommands, context: ExtensionContext): Promise<void> {
	unregisterCommandPalette();

	if (!$config.populateCommandPalette) {
		if (context.globalState.get(Constants.CommandPaletteWasPopulatedStorageKey)) {
			// Setting was enabled then disabled. Only in this case revert/write `package.json`
			// so it would contain only core commands again.
			const { coreCommands, packageJsonObject, packageJsonPath } = await getCommandsFromPackageJson(context);
			packageJsonObject.contributes.commands = coreCommands;
			await vscodeUtils.writeFileVscode(packageJsonPath, JSON.stringify(packageJsonObject, null, '\t'));
			await context.globalState.update(Constants.CommandPaletteWasPopulatedStorageKey, false);
		}
		return;
	}

	const {
		coreCommands,
		oldCommands,
		packageJsonObject,
		packageJsonPath,
		coreCommandPalette,
		otherWorkspacesCommands,
		otherWorkspacesCommandPalette,
	} = await getCommandsFromPackageJson(context);

	const userCommands: Command[] = [];
	const userCommandPalette: { command: string; when: string }[] = [];
	extUtils.forEachCommand((item, key) => {
		if (extUtils.isCommandFolder(item)) {
			return;
		}
		const baseWhen = typeof item === 'string' ?
			'true' :
			item.when ?? 'true';
		const when = isWorkspaceCommandItem(item) ? `${WorkspaceConstants.ContextKey} == ${item.workspace} && ${baseWhen}` : baseWhen;
		userCommands.push({
			command: key,
			title: key,
			category: 'Commands',
			enablement: when,
		});
		userCommandPalette.push({
			command: key,
			when,
		});
	}, items);
	const newCommands = [...coreCommands, ...userCommands];

	if (JSON.stringify(newCommands.sort((a, b) => a.command.localeCompare(b.command))) ===
		JSON.stringify(oldCommands.sort((a, b) => a.command.localeCompare(b.command)))) {
		// Only write file if necessary
		return;
	}

	packageJsonObject.contributes.commands = [...coreCommands, ...otherWorkspacesCommands, ...userCommands];
	packageJsonObject.contributes.menus.commandPalette = [...coreCommandPalette, ...otherWorkspacesCommandPalette, ...userCommandPalette];
	await vscodeUtils.writeFileVscode(packageJsonPath, JSON.stringify(packageJsonObject, null, '\t'));
	await context.globalState.update(Constants.CommandPaletteWasPopulatedStorageKey, true);
}

async function getCommandsFromPackageJson(context: ExtensionContext) {
	const packageJsonPath = context.asAbsolutePath(`./${Constants.PackageJsonFileName}`);
	const packageJsonContent = await vscodeUtils.readFileVscode(packageJsonPath);
	const packageJsonObject = JSON.parse(packageJsonContent);
	const oldCommands = packageJsonObject.contributes.commands as Command[];
	const coreCommands: Command[] = (packageJsonObject.contributes.commands as Command[]).filter(command => coreCommandIds.includes(command.command));
	const coreCommandPalette = (packageJsonObject.contributes.menus.commandPalette as CommandPalette[]).filter(command => coreCommandIds.includes(command.command));
	const workspaceId = getWorkspaceId(context);
	const isOtherWorkspaceCommand = (c: string | undefined) => !workspaceId || c !== undefined && c.includes(WorkspaceConstants.ContextKey) && !c.includes(workspaceId);
	const otherWorkspacesCommands = packageJsonObject.contributes.commands.filter((c: Command) => isOtherWorkspaceCommand(c.enablement));
	const otherWorkspacesCommandPalette = packageJsonObject.contributes.menus.commandPalette.filter((c: CommandPalette) => isOtherWorkspaceCommand(c.when));

	return {
		packageJsonPath,
		packageJsonObject,
		oldCommands,
		coreCommands,
		coreCommandPalette,
		otherWorkspacesCommands,
		otherWorkspacesCommandPalette,
	};
}

/**
 * Dispose user defined commands.
 */
export function unregisterCommandPalette(): void {
	for (const command of commandPaletteCommandsList) {
		command.dispose();
	}
	commandPaletteCommandsList.length = 0;
}
