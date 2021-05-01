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

export async function updateCommandPalette(items: TopLevelCommands, context: ExtensionContext) {
	if (!extensionConfig.populateCommandPalette) {
		return;
	}
	const packageJsonPath = context.asAbsolutePath('./package.json');
	const packageJson = await fs.promises.readFile(packageJsonPath);
	const packageAsJSON = JSON.parse(packageJson.toString());
	const oldCommands: ICommand[] = packageAsJSON.contributes.commands;
	const newCommands: ICommand[] = [];

	const additionalCommands: ICommand[] = [];
	forEachItem((item, key) => {
		if (item.nestedItems) {
			return;
		}
		additionalCommands.push({
			command: key,
			title: key,
			category: 'Commands',
		});
	}, items);
	for (const newCom of additionalCommands) {
		if (oldCommands.find(oldCom => oldCom.command === newCom.command && oldCom.title === newCom.title)) {
			continue;
		}
		newCommands.push(newCom);
	}
	if (newCommands.length === 0) {
		return;
	}
	packageAsJSON.contributes.commands = [...oldCommands, ...newCommands];
	await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageAsJSON, null, '\t'));
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
