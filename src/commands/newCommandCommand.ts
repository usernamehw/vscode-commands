import { window } from 'vscode';
import { addArgs } from '../args';
import { applyForTreeItem } from '../commands';
import { $config, Constants } from '../extension';
import { commandsToQuickPickItems, removeCodiconFromLabel } from '../quickPick';
import { updateSetting } from '../settings';
import { FolderTreeItem } from '../TreeViewProvider';
import { deepCopy, forEachCommand, getAllVscodeCommands, goToSymbol, openSettingsJSON } from '../utils';

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
			const commandsCopy = deepCopy(configTarget === 'workspace' ? $config.workspaceCommands : $config.commands);

			forEachCommand((com, key) => {
				if (key !== folderTreeItem.label) {
					return;
				}
				if (!com.nestedItems) {
					return;
				}
				// @ts-ignore
				com.nestedItems = {
					...com.nestedItems,
					[newCommandKey]: newCommand,
				};
			}, commandsCopy);

			await updateSetting(settingId, commandsCopy, configTarget);
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
