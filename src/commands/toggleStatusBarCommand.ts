import { window } from 'vscode';
import { $config } from '../extension';
import { updateSetting } from '../settings';
import { type FolderTreeItem, type RunCommandTreeItem } from '../TreeViewProvider';
import { type CommandFolder, type CommandObject, type TopLevelCommands } from '../types';
import { extensionUtils } from '../utils/extensionUtils';
import { utils } from '../utils/utils';

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
	extensionUtils.applyForTreeItem(({ commands, settingId, configTarget }) => {
		const configCommands: TopLevelCommands = utils.deepCopy(commands);
		for (const key in configCommands) {
			const commandObject = configCommands[key];
			if (key === labelName) {
				toggleStatusBarItem(commandObject);
				break;
			}
			if (extensionUtils.isCommandFolder(commandObject)) {
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
