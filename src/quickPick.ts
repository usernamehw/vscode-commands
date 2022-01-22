import { commands, QuickInputButton, QuickPickItem, ThemeIcon, window } from 'vscode';
import { hasArgs } from './args';
import { CommandIds } from './commands';
import { run } from './run';
import { Runnable, TopLevelCommands } from './types';
import { goToSymbol, openSettingsJSON } from './utils';
import { isWorkspaceCommandItem } from './workspaceCommands';
/**
 * Show quick pick with user commands. After picking one - run it.
 */
export function showQuickPick(commandsForPicking: TopLevelCommands) {
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

	const newCommandButton: QuickInputButton = {
		iconPath: new ThemeIcon('add'),
		tooltip: 'Add new command',
	};

	const revealCommandButton: QuickInputButton = {
		iconPath: new ThemeIcon('go-to-file'),
		tooltip: 'Reveal in settings.json',
	};

	const quickPickItems: QuickPickItem[] = Object.keys(treeAsOneLevelMap).map(label => ({
		label,
		buttons: [revealCommandButton],
	}));
	let pickedItem: QuickPickItem | undefined;
	const quickPick = window.createQuickPick();
	quickPick.title = 'Run command';
	quickPick.items = quickPickItems;
	quickPick.buttons = [
		newCommandButton,
	];
	quickPick.onDidTriggerItemButton(async e => {
		if (e.button.tooltip === revealCommandButton.tooltip) {
			const clickedItem = treeAsOneLevelMap[e.item.label];
			await openSettingsJSON(isWorkspaceCommandItem(clickedItem) ? 'workspace' : 'global');
			goToSymbol(window.activeTextEditor, e.item.label);
		}
		quickPick.hide();
		quickPick.dispose();
	});
	quickPick.onDidChangeSelection(e => {
		pickedItem = e[0];
	});
	quickPick.onDidTriggerButton(e => {
		if (e.tooltip === newCommandButton.tooltip) {
			commands.executeCommand(CommandIds.newCommand);
		}
		quickPick.hide();
		quickPick.dispose();
	});

	quickPick.onDidAccept(async () => {
		if (pickedItem) {
			await run(treeAsOneLevelMap[pickedItem.label]);
		}
		quickPick.hide();
		quickPick.dispose();
	});
	quickPick.show();
}

/**
 * - Convert command ids to {@link QuickPickItem `QuickPickItem[]`}
 * - Add `args` detail to commands that can accept arguments.
 */
export function commandsToQuickPickItems(commandList: string[]): QuickPickItem[] {
	const quickPickItems: QuickPickItem[] = [];
	for (const com of commandList) {
		quickPickItems.push({
			label: `${com}${hasArgs(com) ? ' ($(pass-filled) args)' : ''}`,
		});
	}
	return quickPickItems;
}

export function removeCodiconFromLabel(str: string) {
	return str.replace(/\s\(\$\([a-z-]+\)\sargs\)/i, '');
}
