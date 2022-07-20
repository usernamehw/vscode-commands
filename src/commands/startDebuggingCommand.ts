import { debug, workspace } from 'vscode';

export async function startDebuggingCommand(name: string) {
	await debug.startDebugging(workspace.workspaceFolders?.[0], name);
}
