import { incrementSetting } from '../settings';
import { ToggleSettingType } from '../types';
import { isSimpleObject } from '../utils';

export function incrementSettingCommand(arg: ToggleSettingType | string) {
	let setting;
	let value;
	if (typeof arg === 'string') {
		setting = arg;
	} else if (isSimpleObject(arg)) {
		setting = arg.setting;
		value = arg.value;
	}
	if (typeof value === 'undefined') {
		value = 1;
	}
	incrementSetting(setting, value);
}
