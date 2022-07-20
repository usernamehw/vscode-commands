import { window } from 'vscode';
import { addArgs } from '../args';
import { applyForTreeItem } from '../commands';
import { $config, Constants } from '../extension';
import { commandsToQuickPickItems, removeCodiconFromLabel } from '../quickPick';
import { updateSetting } from '../settings';
import { FolderTreeItem } from '../TreeViewProvider';
import { TopLevelCommands } from '../types';
import { getAllVscodeCommands, goToSymbol, openSettingsJSON } from '../utils';

export async function newCommandCommand() {
	await addNewCommand();
}

export async function newCommandInFolderCommand(folderTreeItem: FolderTreeItem) {
	await addNewCommand(folderTreeItem);
}

async function addNewCommand(folderTreeItem?: FolderTreeItem) {
	const quickPickItems = commandsToQuickPickItems(await getAllVscodeCommands());
	const quickPickTitle = `Add command to ${folderTreeItem ? `"${folderTreeItem.getLabelName()}"` : 'root'}.`;
	const pickedCommand = await window.showQuickPick(quickPickItems, {
		title: quickPickTitle,
	});
	if (!pickedCommand) {
		return;
	}
	const label = removeCodiconFromLabel(pickedCommand.label);
	const newCommand = addArgs(label);
	const newCommandKey = `${label}_${Math.random().toString().slice(2, 4)}`;

	if (folderTreeItem) {
		applyForTreeItem(async ({ treeItem, commands, settingId, configTarget }) => {
			const newCommandsSetting: TopLevelCommands = {};
			for (const key in commands) {
				const item = commands[key];
				if (key === treeItem.getLabelName()) {
					// @ts-ignore
					newCommandsSetting[key] = {
						nestedItems: {
							...item.nestedItems,
							...{
								[newCommandKey]: newCommand,
							},
						},
					};
				} else {
					newCommandsSetting[key] = item;
				}
			}
			await updateSetting(settingId, newCommandsSetting, configTarget);
			await openSettingsJSON(configTarget);
			await goToSymbol(window.activeTextEditor, newCommandKey);
		}, folderTreeItem);
	} else {
		const newCommandsSetting = {
			...$config.commands,
			...{
				[newCommandKey]: newCommand,
			},
		};
		await updateSetting(Constants.CommandsSettingId, newCommandsSetting, 'global');
		await openSettingsJSON('global');
		await goToSymbol(window.activeTextEditor, newCommandKey);
	}
}
