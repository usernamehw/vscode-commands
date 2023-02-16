import path from 'path';
import { commands, Uri, window, workspace } from 'vscode';

export async function openFolderCommand(filePath: string) {
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
