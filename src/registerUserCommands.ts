import { commands } from 'vscode';
import { extensionConfig, registeredCommandsList } from './extension';
import { run } from './run';
import { TopLevelCommands } from './types';
import { forEachItem } from './utils';

/**
 * Register a command to be able to execute it from a keybinding.
 */
export function registerUserCommands(items: TopLevelCommands): void {
	forEachItem((item, key) => {
		registeredCommandsList.push(commands.registerCommand(key, () => {
			run(item);
		}));
		if (extensionConfig.populateCommandPalette) {
			registeredCommandsList.push(commands.registerCommand(key, () => {
				run(item);
			}));
		}
	}, items);
}
/**
 * Dispose user defined commands.
 */
export function unregisterUserCommands(): void {
	for (const command of registeredCommandsList) {
		command.dispose();
	}
	registeredCommandsList.length = 0;
}
