import { incrementSetting, type ToggleSettingType } from '../settings';

export async function incrementSettingCommand(arg: ToggleSettingType | string): Promise<void> {
	await incrementSetting(arg);
}
