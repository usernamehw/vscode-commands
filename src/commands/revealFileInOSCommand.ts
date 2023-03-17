import { commands, Uri } from 'vscode';

export async function revealFileInOsCommand(path: string): Promise<void> {
	await commands.executeCommand('revealFileInOS', Uri.file(path));
}
