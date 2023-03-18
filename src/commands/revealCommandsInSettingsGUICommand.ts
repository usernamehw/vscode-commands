import { Constants } from '../extension';
import { vscodeUtils } from '../reexport';

export function revealCommandsInSettingsGuiCommand(): void {
	vscodeUtils.openSettingGuiAt(`@ext:${Constants.ExtensionId}`);
}
