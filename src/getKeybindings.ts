import { parse } from 'jsonc-parser';
import { Uri, window, type ExtensionContext } from 'vscode';
import { Constants } from './extension';
import { vscodeUtils } from './utils/vscodeUtils';

export interface VsCodeKeybindingItem {
	key: string;
	command: string;
	args?: unknown;
	when?: string;
}

/**
 * Return all keybindings from user `keybindings.json` file.
 */
export async function getKeybindings(context: ExtensionContext): Promise<VsCodeKeybindingItem[]> {
	const keybindingsPath = vscodeUtils.isOnWeb() ?
		Uri.parse(`vscode-userdata:/User/${Constants.KeybindingsJsonFileName}`) :
		Uri.joinPath(context.globalStorageUri, `../../${Constants.KeybindingsJsonFileName}`);

	let allKeybindings: VsCodeKeybindingItem[] = [];
	try {
		const keybindingsContents = await vscodeUtils.readFileVscode(keybindingsPath);
		const keybindingsAsArray = parse(keybindingsContents) as VsCodeKeybindingItem[] ?? [];
		allKeybindings = keybindingsAsArray;
	} catch (err) {
		window.showErrorMessage((err as Error).message);
	}

	return allKeybindings;
}
