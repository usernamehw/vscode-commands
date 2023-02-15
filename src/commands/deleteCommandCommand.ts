import { window, workspace } from 'vscode';
import { applyForTreeItem } from '../commands';
import { Constants } from '../extension';
import { updateSetting } from '../settings';
import { RunCommandTreeItem } from '../TreeViewProvider';
import { TopLevelCommands } from '../types';
import { deepCopy, forEachCommand } from '../utils';

export async function deleteCommandCommand(treeItem: RunCommandTreeItem) {
	const confirmBtnName = 'Delete';
	/**
	 * This: https://github.com/microsoft/vscode/issues/128233
	 */
	const formatSymbol = workspace.getConfiguration('window').get('dialogStyle') === 'custom' ? Constants.NestingSymbol : ' ';
	const button = await window.showWarningMessage(`Do you want to delete "${treeItem.label}"?\n\n${JSON.stringify(treeItem.runnable, null, formatSymbol.repeat(4))}`, {
		modal: true,
	}, confirmBtnName);
	if (button === confirmBtnName) {
		applyForTreeItem(async ({ treeItem, commands, settingId, configTarget }) => {
			const configCommands: TopLevelCommands = deepCopy(commands);// config is readonly, get a copy
			forEachCommand((item, key, parentElement) => {
				if (key === treeItem.label) {
					delete parentElement[key];
				}
			}, configCommands);
			await updateSetting(settingId, configCommands, configTarget);
		}, treeItem);
	}
}
