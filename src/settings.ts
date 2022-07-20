import isEqual from 'lodash/isEqual';
import { ConfigurationTarget, window, workspace } from 'vscode';
import { $config } from './extension';
import { isSimpleObject } from './utils';

/**
 * Type for `toggleSetting` command.
 */
export interface ToggleSettingType {
	setting: string;
	value: unknown[] | string;
}

/**
 * Toggle global user setting.
 */
export async function toggleSetting(arg: ToggleSettingType | string): Promise<void> {
	const settings = workspace.getConfiguration(undefined, null);
	let newValue;

	if (typeof arg === 'string') {
		// Passed only string, assume that's a boolean settings' name and try to toggle it
		const currentSettingValue = settings.get<unknown>(arg);
		if (typeof currentSettingValue !== 'boolean') {
			window.showWarningMessage('Passing a string only works with type Boolean');
			return;
		}
		newValue = !currentSettingValue;
	} else if (isSimpleObject(arg)) {
		const settingName = arg.setting;
		const currentSettingValue = settings.get(settingName);
		const settingValues = arg.value;

		if (Array.isArray(settingValues)) {
			newValue = getNextOrFirstElement(settingValues, currentSettingValue);
		} else if (typeof settingValues === 'string') {
			// Handle comma separated string here (assume it's an array of strings)
			if (settingValues.indexOf(',')) {
				const allValues = settingValues.split(',');
				if (allValues.length === 1) {
					newValue = allValues[0];
				} else {
					newValue = getNextOrFirstElement(allValues, currentSettingValue);
				}
			}
		}

		await settings.update(settingName, newValue, ConfigurationTarget.Global);
		if ($config.toggleSettings.showNotification) {
			window.showInformationMessage(`"${settingName}": ${JSON.stringify(newValue)}`);
		}
	}
}
/**
 * Increment global user setting. To decrement - just pass a negative number.
 */
export async function incrementSetting(settingName: unknown, n: unknown): Promise<void> {
	if (typeof settingName !== 'string') {
		window.showWarningMessage('Setting name must be a string');
		return;
	}
	if (typeof n !== 'number' || isNaN(n)) {
		window.showWarningMessage('Only numbers allowed');
		return;
	}
	const settings = workspace.getConfiguration(undefined, null);
	const currentSettingValue = settings.get<unknown>(settingName);
	if (typeof currentSettingValue !== 'number') {
		window.showWarningMessage('Only works for settings of type `number`');
		return;
	}
	const newValue = Number((currentSettingValue + n).toPrecision(10));
	await settings.update(settingName, newValue, true);
	if ($config.toggleSettings.showNotification) {
		window.showInformationMessage(`"${settingName}": ${newValue}`);
	}
}
/**
 * Update user setting with the new value.
 */
export async function updateSetting(settingName: string, newValue: unknown, target: 'global' | 'workspace'): Promise<void> {
	const settings = workspace.getConfiguration(undefined, null);
	const configurationTarget = target === 'workspace' ? ConfigurationTarget.Workspace : ConfigurationTarget.Global;
	await settings.update(settingName, newValue, configurationTarget);
}
/**
 * Get next item in array. If there is no next - return the first item.
 */
export function getNextOrFirstElement<T>(arr: T[], target: unknown): T {
	const index = arr.findIndex(el => isEqual(el, target));
	return index === arr.length - 1 ? arr[0] : arr[index + 1];
}
// commands.registerCommand(`${EXTENSION_NAME}.settingsMerge`, (arg: unknown) => {
// 	if (!isSimpleObject(arg)) {
// 		window.showWarningMessage('Argument must be an object');
// 		return;
// 	}
// 	const settings = workspace.getConfiguration(undefined, null);
// 	const settingName = arg.setting;
// 	if (typeof settingName !== 'string') {
// 		window.showWarningMessage('Must provide `setting`');
// 		return;
// 	}
// 	const objectToMerge = arg.value;
// 	if (!isSimpleObject(objectToMerge)) {
// 		window.showWarningMessage('`value` must be an Object');
// 		return;
// 	}
// 	const oldValue = settings.get(settingName);
// 	const newValue = merge(oldValue, objectToMerge);
// 	settings.update(settingName, newValue, true);
// });
