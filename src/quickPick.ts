import { QuickPickItem, window } from 'vscode';
import { commandArgs } from './args';
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

/**
 * - Convert command ids to {@link QuickPickItem `QuickPickItem[]`}
 * - Add `args` detail to commands that can accept arguments.
 */
export function commandsToQuickPickItems(commandList: string[]): QuickPickItem[] {
	const result: QuickPickItem[] = [];
	for (const com of commandList) {
		if (com in commandArgs) {
			result.push({
				label: `${com} ($(pass-filled) args)`,
			});
		} else {
			result.push({
				label: com,
			});
		}
	}
	return result;
}
