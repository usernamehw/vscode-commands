import fs from 'fs';
import JSONC from 'jsonc-simple-parser';
import path from 'path';
import { ExtensionContext, window } from 'vscode';

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
	const UserDirPath = path.join(context.logUri.fsPath, '..', '..', '..', '..', 'User');
	const keybindingsPath = path.join(UserDirPath, 'keybindings.json');
	let allKeybindings: VSCodeKeybindingItem[] = [];
	try {
		const keybindingsContents = await fs.promises.readFile(keybindingsPath);
		const keybindingsAsArray = JSONC.parse(keybindingsContents.toString());
		allKeybindings = keybindingsAsArray;
	} catch (err) {
		window.showErrorMessage((err as Error).message);
	}

	return allKeybindings;
}
