import { window } from 'vscode';
import { run } from './run';
import { Runnable, TopLevelCommands } from './types';
/**
 * Show quick pick with commands. After picking one - run it.
 */
export async function showQuickPick(commandsForPicking: TopLevelCommands) {
	const treeAsOneLevelMap: Record<string, Runnable> = {};
	function traverseCommands(items: TopLevelCommands): void {
		for (const key in items) {
			const command = items[key];
			if (command.nestedItems) {
				traverseCommands(command.nestedItems);
			} else {
				treeAsOneLevelMap[key] = command;
			}
		}
	}
	traverseCommands(commandsForPicking);
	const pickedCommandTitle = await window.showQuickPick(Object.keys(treeAsOneLevelMap));
	if (pickedCommandTitle) {
		await run(treeAsOneLevelMap[pickedCommandTitle]);
	}
}
