import isEqual from 'lodash/isEqual';
import { extensions, window, workspace } from 'vscode';
import { vscodeUtils } from '../utils/vscodeUtils';

export async function modifiedExtensionSettings(): Promise<void> {
	const extensionId = await window.showQuickPick((extensions.all.map(ext => ext.id)));
	if (!extensionId) {
		return;
	}

	type Configuration = { properties: Record<string, unknown> }[] | { properties: Record<string, unknown> };
	const extension = extensions.getExtension(extensionId);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
	const configuration: Configuration | undefined = extension?.packageJSON?.contributes?.configuration;

	if (configuration === undefined) {
		window.showInformationMessage(`Extension "${extensionId}" contributes no settings.`, {
			modal: true,
		});
		return;
	}

	const extensionSettingIds: string[] = [];

	if (Array.isArray(configuration)) {
		for (const conf of configuration) {
			extensionSettingIds.push(...Object.keys(conf.properties));
		}
	} else {
		extensionSettingIds.push(...Object.keys(configuration.properties));
	}

	const allModifiedSettings: Record<string, unknown> = {};

	for (const settingId of extensionSettingIds) {
		const [prefix, ...rest] = settingId.split('.');
		if (!prefix) {
			window.showErrorMessage(`No extension prefix (no dot) in "${settingId}"`, {
				modal: true,
			});
			continue;
		}
		const settingValue = workspace.getConfiguration(prefix).get(rest.join('.'));
		const inspected = workspace.getConfiguration(prefix).inspect(rest.join('.'));
		if (!isEqual(settingValue, inspected?.defaultValue)) {
			allModifiedSettings[settingId] = settingValue;
		}
	}

	if (Object.keys(allModifiedSettings).length === 0) {
		window.showInformationMessage(`No modified settings in "${extensionId}`, {
			modal: true,
		});
		return;
	}

	vscodeUtils.openInUntitled(JSON.stringify(allModifiedSettings, null, '\t'), 'jsonc');
}
