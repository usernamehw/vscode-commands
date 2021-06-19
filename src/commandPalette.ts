import fs from 'fs';
import { ExtensionContext } from 'vscode';
import { commandPaletteCommandsList, extensionConfig } from './extension';
import { TopLevelCommands } from './types';
import { forEachItem } from './utils';

interface ICommand {
	command: string;
	title: string;
	category?: string;
}

const coreCommandIds = [
	'commands.openAsQuickPick',
	'commands.suggestCommands',
	'commands.newCommand',
	'commands.newFolder',
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
	if (!extensionConfig.populateCommandPalette) {
		return;
	}

	const packageJsonPath = context.asAbsolutePath('./package.json');
	const packageJsonFile = await fs.promises.readFile(packageJsonPath);
	const packageJSONObject = JSON.parse(packageJsonFile.toString());
	const oldCommands = packageJSONObject.contributes.commands as ICommand[];
	const coreCommands: ICommand[] = (packageJSONObject.contributes.commands as ICommand[]).filter(command => coreCommandIds.includes(command.command));

	const userCommands: ICommand[] = [];
	forEachItem((item, key) => {
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
