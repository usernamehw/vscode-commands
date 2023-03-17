import { debug, workspace } from 'vscode';

export async function startDebuggingCommand(name: string): Promise<void> {
	await debug.startDebugging(workspace.workspaceFolders?.[0], name);
}
