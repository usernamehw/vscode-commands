import { parse } from 'jsonc-parser';
import path from 'path';
import { ExtensionContext, Uri, window, workspace } from 'vscode';
import { isOnWeb, showNotOnWebNotification, uint8ArrayToString } from './utils';

export interface VSCodeKeybindingItem {
	key: string;
	command: string;
	args?: any;
	when?: string;
}

/**
 * Return all keybindings from user `keybindings.json` file.
 */
export async function getKeybindings(context: ExtensionContext): Promise<VSCodeKeybindingItem[]> {
	if (isOnWeb()) {
		showNotOnWebNotification('Using setting "commands.showKeybindings".');
		return [];
	}
	const UserDirPath = path.join(context.logUri.fsPath, '..', '..', '..', '..', '..', 'User');
	const keybindingsPath = path.join(UserDirPath, 'keybindings.json');
	let allKeybindings: VSCodeKeybindingItem[] = [];
	try {
		const keybindingsContents = await workspace.fs.readFile(Uri.file(keybindingsPath));
		const keybindingsAsArray = parse(uint8ArrayToString(keybindingsContents));
		allKeybindings = keybindingsAsArray;
	} catch (err) {
		window.showErrorMessage((err as Error).message);
	}

	return allKeybindings;
}
