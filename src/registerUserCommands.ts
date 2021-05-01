import { commands } from 'vscode';
import { getAllVscodeCommands } from './commands';
import { registeredCommandsList } from './extension';
import { run } from './run';
import { TopLevelCommands } from './types';
import { forEachItem } from './utils';

/**
 * Register a command to be able to execute it from a keybinding.
 */
export async function registerUserCommands(items: TopLevelCommands) {
	const allCommands = await getAllVscodeCommands();

	forEachItem((item, key) => {
		if (allCommands.includes(key)) {
			console.warn(`Cannot register command twice: "${key}"`);
			return;
		}
		registeredCommandsList.push(commands.registerCommand(key, () => {
			run(item);
		}));
	}, items);
}
/**
 * Dispose user defined commands.
 */
export function unregisterUserCommands() {
	for (const command of registeredCommandsList) {
		command.dispose();
	}
	registeredCommandsList.length = 0;
}
