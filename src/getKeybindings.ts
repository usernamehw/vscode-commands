import { parse } from 'jsonc-parser';
import path from 'path';
import { Uri, window, workspace, type ExtensionContext } from 'vscode';
import { isOnWeb, showNotOnWebNotification, uint8ArrayToString } from './utils';

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
	if (isOnWeb()) {
		showNotOnWebNotification('Using setting "commands.showKeybindings".');
		return [];
	}
	const userDirPath = path.join(context.logUri.fsPath, '..', '..', '..', '..', '..', 'User');
	const keybindingsPath = path.join(userDirPath, 'keybindings.json');
	let allKeybindings: VsCodeKeybindingItem[] = [];
	try {
		const keybindingsContents = await workspace.fs.readFile(Uri.file(keybindingsPath));
		const keybindingsAsArray = parse(uint8ArrayToString(keybindingsContents));
		allKeybindings = keybindingsAsArray;
	} catch (err) {
		window.showErrorMessage((err as Error).message);
	}

	return allKeybindings;
}
