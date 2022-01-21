import { v4 as uuid } from 'uuid';
import * as vscode from 'vscode';
import { CommandFolder, CommandObject, TopLevelCommands, WorkspaceCommand } from './types';
import { forEachCommand } from './utils';

export const workspaceContextKey = 'usernamehw.commands.workspaceId';

export function getWorkspaceId(context: vscode.ExtensionContext): string | undefined {
	return context.workspaceState.get<string>('workspaceId');
}

export async function setWorkspaceIdToContext(context: vscode.ExtensionContext): Promise<string> {
	let maybeWorkspaceId = getWorkspaceId(context);
	if (!maybeWorkspaceId) {
		maybeWorkspaceId = uuid();
		await context.workspaceState.update('workspaceId', maybeWorkspaceId);
	}
	const workspaceId = maybeWorkspaceId;
	await vscode.commands.executeCommand('setContext', workspaceContextKey, workspaceId);
	return workspaceId;
}

export function isWorkspaceCommandItem(item: any): item is (CommandFolder & WorkspaceCommand) | (CommandObject & WorkspaceCommand) {
	return item.workspace !== undefined;
}

export function addWorkspaceIdToCommands(items: TopLevelCommands, workspaceId: string) {
	const itemsDeepCopy = JSON.parse(JSON.stringify(items));
	forEachCommand(item => {
		item.workspace = workspaceId;
	}, itemsDeepCopy);
	return itemsDeepCopy;
}
