import { commands, window, type Disposable } from 'vscode';
import { $config, $state, Constants } from './extension';
import { run } from './run';
import { type TopLevelCommands } from './types';
import { extUtils } from './utils/extUtils';
import { utils } from './utils/utils';

const registeredCommandsDisposables: Disposable[] = [];

/**
 * Register commands to be able to execute it from a keybinding.
 */
export function updateUserCommands(items: TopLevelCommands): void {
	unregisterUserCommands();

	extUtils.forEachCommand((item, key) => {
		if (key === '') {
			// Don't show error message for empty string. User is likely typing.
			return;
		}
		let disposable: Disposable;
		try {
			disposable = commands.registerCommand(key, () => {
				run(item);
			});
			registeredCommandsDisposables.push(disposable);
		} catch (err) {
			window.showErrorMessage(`Failed to register command: ${(err as Error).message}`);
		}
	}, items);

	for (const alias in $config.alias) {
		const command = $config.alias[alias];
		let disposable: Disposable;
		try {
			disposable = commands.registerCommand(alias, (args: unknown[]) => {
				run({
					command,
					args,
				});
			});
			registeredCommandsDisposables.push(disposable);
		} catch (err) {
			window.showErrorMessage(`Failed to register alias: ${(err as Error).message}`);
		}
	}

	for (const cycle in $config.cycle) {
		const commandList = $config.cycle[cycle];

		let disposable: Disposable;
		try {
			disposable = commands.registerCommand(`${Constants.ExtensionSettingsPrefix}.cycle.${cycle}`, () => {
				const lastCommandInCycle = $state.cycles[cycle];

				let commandToRun;
				if (lastCommandInCycle) {
					commandToRun = utils.getNextOrFirstElement(commandList, lastCommandInCycle);
				} else {
					commandToRun = commandList[0];
				}

				if (!commandToRun) {
					window.showErrorMessage(`No command to run`);
					return;
				}

				run({
					command: commandToRun,
				});
				$state.cycles[cycle] = commandToRun;
			});
			registeredCommandsDisposables.push(disposable);
		} catch (err) {
			window.showErrorMessage(`Failed to register cycle commands: ${(err as Error).message}`);
		}
	}
}
/**
 * Dispose user defined commands.
 */
export function unregisterUserCommands(): void {
	for (const command of registeredCommandsDisposables) {
		command.dispose();
	}
	registeredCommandsDisposables.length = 0;
}
