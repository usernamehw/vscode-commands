import { commands, Disposable, window } from 'vscode';
import { $config } from './extension';
import { run } from './run';
import { TopLevelCommands } from './types';
import { forEachCommand, getAllVscodeCommands, goToSymbol, openSettingsJSON } from './utils';

const registeredCommandsList: Disposable[] = [];

/**
 * Register a command to be able to execute it from a keybinding.
 */
export async function updateUserCommands(items: TopLevelCommands): Promise<void> {
	unregisterUserCommands();

	const allCommands = await getAllVscodeCommands();

	forEachCommand(async (item, key) => {
		if (allCommands.includes(key)) {
			const revealButton = 'Reveal';
			const button = await window.showWarningMessage(`Command key must be unique (even among already registered commands) "${key}".`, revealButton);
			if (button) {
				await openSettingsJSON(item.workspace ? 'workspace' : 'global');
				await goToSymbol(window.activeTextEditor, key);
			}
			return;
		}
		registeredCommandsList.push(commands.registerCommand(key, () => {
			run(item);
		}));
	}, items);

	for (const alias in $config.alias) {
		const command = $config.alias[alias];
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
