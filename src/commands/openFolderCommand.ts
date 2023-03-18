import path from 'path';
import { commands, Uri, window, workspace } from 'vscode';

export async function openFolderCommand(arg: string[] | string): Promise<void> {
	if (Array.isArray(arg)) {
		const promises = [];
		for (const filePath of arg) {
			promises.push(openFolder(filePath));
		}
		await Promise.all(promises);
	} else if (typeof arg === 'string') {
		await openFolder(arg);
	}
}

async function openFolder(filePath: string): Promise<void> {
	let fileUri: Uri;
	if (filePath.startsWith('.')) {
		// relative path - use first workspace folder
		if (!workspace.workspaceFolders) {
			window.showWarningMessage('Cannot open relative path if no workspace is opened.');
			return;
		}
		fileUri = Uri.file(path.join(workspace.workspaceFolders[0].uri.fsPath, filePath));
	} else {
		fileUri = Uri.file(filePath);
	}

	await commands.executeCommand('vscode.openFolder', fileUri);
}
