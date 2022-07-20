import { Constants } from '../extension';
import { openSettingGuiAt } from '../utils';

export function revealCommandsInSettingsGUICommand() {
	openSettingGuiAt(`@ext:${Constants.ExtensionId}`);
}
