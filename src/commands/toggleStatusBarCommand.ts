import { window } from 'vscode';
import { applyForTreeItem } from '../commands';
import { $config } from '../extension';
import { updateSetting } from '../settings';
import { FolderTreeItem, RunCommandTreeItem } from '../TreeViewProvider';
import { CommandObject, TopLevelCommands } from '../types';
import { deepCopy } from '../utils';

export async function toggleStatusBarCommand(treeItem: FolderTreeItem | RunCommandTreeItem) {
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
	applyForTreeItem(({ commands, settingId, configTarget }) => {
		const configCommands: TopLevelCommands = deepCopy(commands);
		for (const key in configCommands) {
			const commandObject = configCommands[key];
			if (key === labelName) {
				toggleStatusBarItem(commandObject);
				break;
			}
			if (commandObject.nestedItems) {
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
	function toggleStatusBarItem(commandObject: CommandObject) {
		if (commandObject.statusBar) {
			commandObject.statusBar.hidden = !commandObject.statusBar.hidden;
		} else {
			commandObject.statusBar = {
				text: newStatusBarItemText,
			};
		}
	}
}
