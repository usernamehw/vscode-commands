import { commands, Disposable } from 'vscode';
import { extensionConfig } from './extension';
import { run } from './run';
import { TopLevelCommands } from './types';
import { forEachItem, getAllVscodeCommands } from './utils';

const registeredCommandsList: Disposable[] = [];

/**
 * Register a command to be able to execute it from a keybinding.
 */
export async function updateUserCommands(items: TopLevelCommands) {
	unregisterUserCommands();

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

	for (const alias in extensionConfig.alias) {
		const command = extensionConfig.alias[alias];
		registeredCommandsList.push(commands.registerCommand(alias, (args: unknown) => {
			run({
				command,
				args,
			});
		}));
	}
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
