import { Constants } from '../extension';
import { vscodeUtils } from '../utils/vscodeUtils';

export function revealCommandsInSettingsGuiCommand(): void {
	vscodeUtils.openSettingGuiAt(`@ext:${Constants.ExtensionId}`);
}
