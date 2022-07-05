import fs from 'fs';
import { Disposable, ExtensionContext } from 'vscode';
import { $config, Constants } from './extension';
import { TopLevelCommands } from './types';
import { forEachCommand } from './utils';
import { getWorkspaceId, isWorkspaceCommandItem, WorkspaceConstants } from './workspaceCommands';

const commandPaletteCommandsList: Disposable[] = [];
/**
 * Command format in `package.json`.
 */
interface ICommand {
	command: string;
	title: string;
	category?: string;
	enablement: string;
}
interface ICommandPalette {
	command: string;
	when: string;
}
/**
 * Commands this extension contributes in **commands** section of `package.json`
 */
const coreCommandIds = [
	'commands.openAsQuickPick',
	'commands.rerun',
	'commands.suggestCommands',
	'commands.newCommand',
	'commands.newFolder',
	'commands.deleteCommand',
	'commands.selectAndRun',
	'commands.newCommandInFolder',
	'commands.revealCommand',
	'commands.assignKeybinding',
	'commands.addToStatusBar',
	'commands.revealCommandsInSettignsGUI',
	'commands.escapeCommandUriArgument',
];
/**
 * VSCode doesn't support dynamic Command Palette items: https://github.com/microsoft/vscode/issues/1422
 *
 * This function updates `package.json` file to add items from `commands.commands` to Command Palette (but requires editor reload after changing configuration)
 */
export async function updateCommandPalette(items: TopLevelCommands, context: ExtensionContext) {
	unregisterCommandPalette();

	if (!$config.populateCommandPalette) {
		if (context.globalState.get(Constants.CommandPaletteWasPopulatedStorageKey)) {
			// Setting was enabled then disabled. Only in this case revert/write `package.json`
			// so it would contain only core commands again.
			const { coreCommands, packageJSONObject, packageJsonPath } = await getCommandsFromPackageJson(context);
			packageJSONObject.contributes.commands = coreCommands;
			await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJSONObject, null, '\t'));
			await context.globalState.update(Constants.CommandPaletteWasPopulatedStorageKey, false);
		}
		return;
	}

	const {
		coreCommands,
		oldCommands,
		packageJSONObject,
		packageJsonPath,
		coreCommandPalette,
		otherWorkspacesCommands,
		otherWorkspacesCommandPalette,
	} = await getCommandsFromPackageJson(context);

	const userCommands: ICommand[] = [];
	const userCommandPalette: { command: string; when: string }[] = [];
	forEachCommand((item, key) => {
		if (item.nestedItems) {
			return;// Skip folders
		}
		const baseWhen = item.when ?? 'true';
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
		return;// Only write file if necessary
	}

	packageJSONObject.contributes.commands = [...coreCommands, ...otherWorkspacesCommands, ...userCommands];
	packageJSONObject.contributes.menus.commandPalette = [...coreCommandPalette, ...otherWorkspacesCommandPalette, ...userCommandPalette];
	await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJSONObject, null, '\t'));
	await context.globalState.update(Constants.CommandPaletteWasPopulatedStorageKey, true);
}

async function getCommandsFromPackageJson(context: ExtensionContext) {
	const packageJsonPath = context.asAbsolutePath('./package.json');
	const packageJsonFile = await fs.promises.readFile(packageJsonPath);
	const packageJSONObject = JSON.parse(packageJsonFile.toString());
	const oldCommands = packageJSONObject.contributes.commands as ICommand[];
	const coreCommands: ICommand[] = (packageJSONObject.contributes.commands as ICommand[]).filter(command => coreCommandIds.includes(command.command));
	const coreCommandPalette = (packageJSONObject.contributes.menus.commandPalette as ICommandPalette[]).filter(command => coreCommandIds.includes(command.command));
	const workspaceId = getWorkspaceId(context);
	const isOtherWorkspaceCommand = (c: string | undefined) => !workspaceId || c !== undefined && c.includes(WorkspaceConstants.ContextKey) && !c.includes(workspaceId);
	const otherWorkspacesCommands = packageJSONObject.contributes.commands.filter((c: ICommand) => isOtherWorkspaceCommand(c.enablement));
	const otherWorkspacesCommandPalette = packageJSONObject.contributes.menus.commandPalette.filter((c: ICommandPalette) => isOtherWorkspaceCommand(c.when));
	return {
		packageJsonPath,
		packageJSONObject,
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
export function unregisterCommandPalette() {
	for (const command of commandPaletteCommandsList) {
		command.dispose();
	}
	commandPaletteCommandsList.length = 0;
}
