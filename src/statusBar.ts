import { Disposable, StatusBarAlignment, window } from 'vscode';
import { CommandIds } from './commands';
import { TopLevelCommands } from './types';
import { forEachItem } from './utils';

const statusBarItems: Disposable[] = [];

/**
 * Dispose and refresh all status bar items.
 */
export function updateStatusBarItems(items: TopLevelCommands) {
	disposeStatusBarItems();

	forEachItem((item, key) => {
		if (item.statusBar) {
			const statusBarUserObject = item.statusBar;
			const alignment = statusBarUserObject.alignment === 'right' ? StatusBarAlignment.Right : StatusBarAlignment.Left;
			const newStatusBarItem = window.createStatusBarItem(statusBarUserObject.text, alignment, statusBarUserObject.priority);
			let icon = item.icon ? `$(${item.icon}) ` : '';
			if (item.nestedItems) {
				icon = '$(folder) ';
			}
			newStatusBarItem.name = statusBarUserObject.text;
			newStatusBarItem.color = statusBarUserObject.color;
			newStatusBarItem.tooltip = statusBarUserObject.tooltip || key;
			newStatusBarItem.text = icon + statusBarUserObject.text;
			newStatusBarItem.show();
			newStatusBarItem.command = {
				command: CommandIds.run,
				title: 'Run Command',
				arguments: [item],
			};
			statusBarItems.push(newStatusBarItem);
		}
	}, items);
}
/**
 * Dispose all status bar items.
 */
function disposeStatusBarItems() {
	for (const statusBarItem of statusBarItems) {
		statusBarItem.dispose();
	}
	statusBarItems.length = 0;
}
