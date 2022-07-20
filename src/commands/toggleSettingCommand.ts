import { toggleSetting } from '../settings';
import { ToggleSettingType } from '../types';

export async function toggleSettingCommand(arg: ToggleSettingType | string) {
	await toggleSetting(arg);
}
