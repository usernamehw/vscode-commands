import isEqual from 'lodash/isEqual';
import { ConfigurationTarget, window, workspace } from 'vscode';
import { CommandId } from './commands';
import { $config } from './extension';
import { isSimpleObject } from './utils';

type Target = 'global' | 'workspace';

/**
 * Type for {@link CommandId.ToggleSetting} command.
 */
export interface ToggleSettingType {
	setting: string;
	value?: unknown[] | string;
	target?: Target;
}

/**
 * Toggle global user setting.
 */
export async function toggleSetting(arg: ToggleSettingType | string): Promise<void> {
	const settings = workspace.getConfiguration(undefined, null);
	let newValue: unknown;
	let settingName: string;
	let target: Target = 'global';

	if (typeof arg === 'string') {
		// Passed only string - assume that's a boolean settings' name and try to toggle it
		const currentSettingValue = settings.get<unknown>(arg);
		if (typeof currentSettingValue !== 'boolean') {
			window.showWarningMessage('Passing a string only works if the setting type is Boolean');
			return;
		}
		settingName = arg;
		newValue = !currentSettingValue;
	} else if (isSimpleObject(arg)) {
		// Passed an object of ToggleSettingType type.
		settingName = arg.setting;
		const currentSettingValue = settings.get(settingName);
		const settingValues = arg.value;
		if (arg.target && (['global', 'workspace'] as Target[]).includes(arg.target)) {
			target = arg.target;
		}

		if (settingValues === undefined) {
			// Passed an object. "value" is omitted -> assume it's to toggle a boolean setting
			if (typeof currentSettingValue !== 'boolean') {
				window.showWarningMessage(`Omitting "value" key is only possible if the setting type is Boolean.`);
				return;
			}
			newValue = !currentSettingValue;
		} else if (Array.isArray(settingValues)) {
			// Passed an object. "value" is array -> cycle through
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
	} else {
		window.showWarningMessage(`Argument for ${CommandId.ToggleSetting} must be either a string (for toggling boolean value) or an object with keys: "setting" and "value".`);
		return;
	}

	try {
		await settings.update(settingName, newValue, target === 'global' ? ConfigurationTarget.Global : ConfigurationTarget.Workspace);
	} catch (e) {
		window.showErrorMessage((e as Error).message);
	}

	if ($config.toggleSettings.showNotification) {
		window.showInformationMessage(`"${settingName}": ${JSON.stringify(newValue)}`);
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

	try {
		await settings.update(settingName, newValue, true);
	} catch (e) {
		window.showErrorMessage((e as Error).message);
	}

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
	try {
		await settings.update(settingName, newValue, configurationTarget);
	} catch (e) {
		window.showErrorMessage((e as Error).message);
	}
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
