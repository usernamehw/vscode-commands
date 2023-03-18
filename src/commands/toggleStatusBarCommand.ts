import { window } from 'vscode';
import { $config } from '../extension';
import { extUtils } from '../reexport';
import { updateSetting } from '../settings';
import { type FolderTreeItem, type RunCommandTreeItem } from '../TreeViewProvider';
import { type CommandFolder, type CommandObject, type TopLevelCommands } from '../types';
import { deepCopy } from '../utils/utils';

export async function toggleStatusBarCommand(treeItem: FolderTreeItem | RunCommandTreeItem): Promise<void> {
	const labelName = treeItem.getLabelName();
	let newStatusBarItemText = '';
	if ($config.statusBarDefaultText === 'pick') {
		const text = await window.showInputBox({
			prompt: 'Status Bar text',
		});
		if (!text) {
			return;
		}
		newStatusBarItemText = text;
	} else {
		newStatusBarItemText = labelName;
	}
	extUtils.applyForTreeItem(({ commands, settingId, configTarget }) => {
		const configCommands: TopLevelCommands = deepCopy(commands);
		for (const key in configCommands) {
			const commandObject = configCommands[key];
			if (key === labelName) {
				toggleStatusBarItem(commandObject);
				break;
			}
			if (extUtils.isCommandFolder(commandObject)) {
				for (const key2 in commandObject.nestedItems) {
					const nestedItem = commandObject.nestedItems[key2];
					if (key2 === labelName) {
						toggleStatusBarItem(nestedItem);
						break;
					}
				}
			}
		}
		updateSetting(settingId, configCommands, configTarget);
	}, treeItem);
	function toggleStatusBarItem(commandObject: CommandFolder | CommandObject | string): void {
		if (typeof commandObject === 'string') {
			return;
		}
		if (commandObject.statusBar) {
			commandObject.statusBar.hidden = !commandObject.statusBar.hidden;
		} else {
			commandObject.statusBar = {
				text: newStatusBarItemText,
			};
		}
	}
}
