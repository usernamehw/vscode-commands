import { commands, Uri } from 'vscode';

export async function openFolderCommand(path: string) {
	await commands.executeCommand('vscode.openFolder', Uri.file(path));
}
