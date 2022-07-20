import { window } from 'vscode';
import { $config, Constants } from '../extension';
import { updateSetting } from '../settings';

export async function newFolderCommand() {
	await newFolder();
}

async function newFolder(): Promise<void> {
	const newFolderName = await window.showInputBox({
		title: 'Add folder',
		placeHolder: 'Enter new folder name',
	});
	if (!newFolderName) {
		return;
	}
	const newCommandsSetting = {
		...$config.commands,
		...{
			[newFolderName]: {
				nestedItems: {},
			},
		},
	};
	await updateSetting(Constants.CommandsSettingId, newCommandsSetting, 'global');
}
