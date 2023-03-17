import { Constants } from '../extension';
import { openSettingGuiAt } from '../utils';

export function revealCommandsInSettingsGuiCommand(): void {
	openSettingGuiAt(`@ext:${Constants.ExtensionId}`);
}
