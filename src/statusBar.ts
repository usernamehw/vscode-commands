import { StatusBarAlignment, window } from 'vscode';
import { RUN_COMMAND_ID, statusBarItems } from './extension';
import { TopLevelCommands } from './types';
import { forEachItem } from './utils';

export function updateStatusBarItems(items: TopLevelCommands) {
	disposeStatusBarItems();

	forEachItem(item => {
		if (item.statusBar) {
			const statusBarUserObject = item.statusBar;
			const alignment = statusBarUserObject.alignment === 'right' ? StatusBarAlignment.Right : StatusBarAlignment.Left;
			const newStatusBarItem = window.createStatusBarItem(alignment, statusBarUserObject.priority);
			const icon = item.icon ? `$(${item.icon}) ` : '';
			newStatusBarItem.color = statusBarUserObject.color;
			newStatusBarItem.tooltip = statusBarUserObject.tooltip;
			newStatusBarItem.text = icon + statusBarUserObject.text;
			newStatusBarItem.show();
			newStatusBarItem.command = {
				command: RUN_COMMAND_ID,
				title: 'Run Command',
				arguments: [item],
			};
			statusBarItems.push(newStatusBarItem);
		}
	}, items);
}

function disposeStatusBarItems() {
	for (const statusBarItem of statusBarItems) {
		statusBarItem.dispose();
	}
	statusBarItems.length = 0;
}
