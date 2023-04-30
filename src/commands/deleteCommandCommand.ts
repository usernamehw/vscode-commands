import { window, workspace } from 'vscode';
import { Constants } from '../extension';
import { updateSetting } from '../settings';
import { type RunCommandTreeItem } from '../TreeViewProvider';
import { type TopLevelCommands } from '../types';
import { extUtils } from '../utils/extUtils';
import { utils } from '../utils/utils';

export async function deleteCommandCommand(targetTreeItem: RunCommandTreeItem): Promise<void> {
	const confirmBtnName = 'Delete';
	/**
	 * This: https://github.com/microsoft/vscode/issues/128233
	 */
	const formatSymbol = workspace.getConfiguration('window').get('dialogStyle') === 'custom' ? Constants.NestingSymbol : ' ';
	const button = await window.showWarningMessage(`Do you want to delete "${targetTreeItem.getLabelName()}"?\n\n${JSON.stringify(targetTreeItem.runnable, null, formatSymbol.repeat(4))}`, {
		modal: true,
	}, confirmBtnName);
	if (button === confirmBtnName) {
		extUtils.applyForTreeItem(async ({ treeItem, commands, settingId, configTarget }) => {
			const configCommands: TopLevelCommands = utils.deepCopy(commands);// config is readonly, get a copy
			extUtils.forEachCommand((item, key, parentElement) => {
				if (key === treeItem.label) {
					delete parentElement[key];
				}
			}, configCommands);
			await updateSetting(settingId, configCommands, configTarget);
		}, targetTreeItem);
	}
}
