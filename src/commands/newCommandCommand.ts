import { window } from 'vscode';
import { addArgs } from '../args';
import { $config, Constants } from '../extension';
import { commandsToQuickPickItems } from '../quickPick';
import { extUtils, utils, vscodeUtils } from '../reexport';
import { updateSetting } from '../settings';
import { type FolderTreeItem } from '../TreeViewProvider';

export async function newCommandCommand(): Promise<void> {
	await addNewCommand();
}

export async function newCommandInFolderCommand(folderTreeItem: FolderTreeItem): Promise<void> {
	await addNewCommand(folderTreeItem);
}

async function addNewCommand(folderTreeItem?: FolderTreeItem): Promise<void> {
	const quickPickItems = commandsToQuickPickItems(await vscodeUtils.getAllVscodeCommands());
	const quickPickTitle = `Add command to ${folderTreeItem ? `"${folderTreeItem.getLabelName()}"` : 'root'}.`;

	const pickedCommand = await window.showQuickPick(quickPickItems, {
		title: quickPickTitle,
	});

	if (!pickedCommand) {
		return;
	}

	const label = pickedCommand.key;
	const newCommand = addArgs(label);
	const newCommandKey = `${label}_${Math.random().toString().slice(2, 5)}`;

	if (folderTreeItem) {
		extUtils.applyForTreeItem(async ({ treeItem, commands, settingId, configTarget }) => {
			const commandsCopy = utils.deepCopy(configTarget === 'workspace' ? $config.workspaceCommands : $config.commands);

			extUtils.forEachCommand((com, key) => {
				if (key !== folderTreeItem.label) {
					return;
				}
				if (!extUtils.isCommandFolder(com)) {
					return;
				}
				com.nestedItems = {
					...com.nestedItems,
					[newCommandKey]: newCommand,
				};
			}, commandsCopy);

			await updateSetting(settingId, commandsCopy, configTarget);
			await vscodeUtils.openSettingsJson(configTarget);
			await vscodeUtils.goToSymbol(window.activeTextEditor, newCommandKey);
		}, folderTreeItem);
	} else {
		const newCommandsSetting = {
			...$config.commands,
			...{
				[newCommandKey]: newCommand,
			},
		};
		await updateSetting(Constants.ExtensionMainSettingId, newCommandsSetting, 'global');
		await vscodeUtils.openSettingsJson('global');
		await vscodeUtils.goToSymbol(window.activeTextEditor, newCommandKey);
	}
}
