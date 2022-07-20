import { toggleSetting, ToggleSettingType } from '../settings';

export async function toggleSettingCommand(arg: ToggleSettingType | string) {
	await toggleSetting(arg);
}
