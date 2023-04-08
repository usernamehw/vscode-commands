import { window } from 'vscode';
import { $config, Constants } from '../extension';
import { updateSetting } from '../settings';
import { type FolderTreeItem } from '../TreeViewProvider';
import { type CommandFolder } from '../types';
import { extensionUtils } from '../utils/extensionUtils';
import { utils } from '../utils/utils';

export async function newFolderCommand(): Promise<void> {
	await newFolder();
}

export async function newFolder(folderTreeItem?: FolderTreeItem): Promise<void> {
	const newFolderName = await window.showInputBox({
		title: `New folder ${folderTreeItem ? ` inside "${folderTreeItem.getLabelName()}"` : ''}`,
		placeHolder: 'Enter new folder name',
	});
	if (!newFolderName) {
		return;
	}

	const emptyFolder: CommandFolder = {
		nestedItems: {},
	};

	if (folderTreeItem) {
		// New folder inside another folder
		extensionUtils.applyForTreeItem(async ({ treeItem, commands, settingId, configTarget }) => {
			const commandsCopy = utils.deepCopy(configTarget === 'workspace' ? $config.workspaceCommands : $config.commands);

			extensionUtils.forEachCommand((com, key) => {
				if (key !== folderTreeItem.label) {
					return;
				}
				if (!extensionUtils.isCommandFolder(com)) {
					return;
				}
				com.nestedItems = {
					...com.nestedItems,
					[newFolderName]: emptyFolder,
				};
			}, commandsCopy);

			await updateSetting(settingId, commandsCopy, configTarget);
		}, folderTreeItem);
	} else {
		// New folder in root
		const newCommandsSetting = {
			...$config.commands,
			...{
				[newFolderName]: emptyFolder,
			},
		};
		await updateSetting(Constants.ExtensionMainSettingId, newCommandsSetting, 'global');
	}
}
