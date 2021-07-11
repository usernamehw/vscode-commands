import fs from 'fs';
import { Disposable, ExtensionContext } from 'vscode';
import { Constants, extensionConfig } from './extension';
import { TopLevelCommands } from './types';
import { forEachCommand } from './utils';

const commandPaletteCommandsList: Disposable[] = [];
/**
 * Command format in `package.json`.
 */
interface ICommand {
	command: string;
	title: string;
	category?: string;
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
];
/**
 * VSCode doesn't support dynamic Command Palette items: https://github.com/microsoft/vscode/issues/1422
 *
 * This function updates `package.json` file to add items from `commands.commands` to Command Palette (but requires editor reload after changing configuration)
 */
export async function updateCommandPalette(items: TopLevelCommands, context: ExtensionContext) {
	unregisterCommandPalette();

	if (!extensionConfig.populateCommandPalette) {
		if (context.globalState.get(Constants.COMMAND_PALETTE_WAS_POPULATED_STORAGE_KEY)) {
			// Setting was enabled then disabled. Only in this case revert/write `package.json`
			// so it would contain only core commands again.
			const { coreCommands, packageJSONObject, packageJsonPath } = await getCommandsFromPackageJson(context);
			packageJSONObject.contributes.commands = coreCommands;
			await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJSONObject, null, '\t'));
			await context.globalState.update(Constants.COMMAND_PALETTE_WAS_POPULATED_STORAGE_KEY, false);
		}
		return;
	}

	const { coreCommands, oldCommands, packageJSONObject, packageJsonPath } = await getCommandsFromPackageJson(context);

	const userCommands: ICommand[] = [];
	forEachCommand((item, key) => {
		if (item.nestedItems) {
			return;// Skip folders
		}
		userCommands.push({
			command: key,
			title: key,
			category: 'Commands',
		});
	}, items);
	const newCommands = [...coreCommands, ...userCommands];

	if (JSON.stringify(newCommands.sort((a, b) => a.command.localeCompare(b.command))) ===
		JSON.stringify(oldCommands.sort((a, b) => a.command.localeCompare(b.command)))) {
		return;// Only write file if necessary
	}

	packageJSONObject.contributes.commands = [...coreCommands, ...userCommands];
	await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJSONObject, null, '\t'));
	await context.globalState.update(Constants.COMMAND_PALETTE_WAS_POPULATED_STORAGE_KEY, true);
}

async function getCommandsFromPackageJson(context: ExtensionContext) {
	const packageJsonPath = context.asAbsolutePath('./package.json');
	const packageJsonFile = await fs.promises.readFile(packageJsonPath);
	const packageJSONObject = JSON.parse(packageJsonFile.toString());
	const oldCommands = packageJSONObject.contributes.commands as ICommand[];
	const coreCommands: ICommand[] = (packageJSONObject.contributes.commands as ICommand[]).filter(command => coreCommandIds.includes(command.command));
	return {
		packageJsonPath,
		packageJSONObject,
		oldCommands,
		coreCommands,
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
