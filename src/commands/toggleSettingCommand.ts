import { $config } from '../extension';
import { toggleSetting, type ToggleSettingType } from '../settings';

export async function toggleSettingCommand(arg: ToggleSettingType | string): Promise<void> {
	await toggleSetting(arg, $config.toggleSettings.showNotification);
}
