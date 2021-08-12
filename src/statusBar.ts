import { Disposable, StatusBarAlignment, window } from 'vscode';
import { CommandIds } from './commands';
import { createFolderHoverText } from './folderHoverText';
import { TopLevelCommands } from './types';
import { forEachCommand } from './utils';

const statusBarItems: Disposable[] = [];

/**
 * Dispose and refresh all status bar items.
 */
export function updateStatusBarItems(items: TopLevelCommands) {
	disposeStatusBarItems();

	forEachCommand((item, key) => {
		if (item.statusBar) {
			const statusBarUserObject = item.statusBar;
			const alignment = statusBarUserObject.alignment === 'right' ? StatusBarAlignment.Right : StatusBarAlignment.Left;
			const newStatusBarItem = window.createStatusBarItem(statusBarUserObject.text, alignment, statusBarUserObject.priority ?? -9999);
			let icon = item.icon ? `$(${item.icon}) ` : '';
			newStatusBarItem.name = statusBarUserObject.text;
			newStatusBarItem.color = statusBarUserObject.color;
			newStatusBarItem.tooltip = statusBarUserObject.tooltip || key;
			if (item.nestedItems) {
				icon = '$(folder) ';
				newStatusBarItem.tooltip = createFolderHoverText(item.nestedItems);
			}

			newStatusBarItem.text = icon + (statusBarUserObject.text || '');
			newStatusBarItem.command = {
				command: CommandIds.run,
				title: 'Run Command',
				arguments: [item],
			};

			newStatusBarItem.show();
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
