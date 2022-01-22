import { commands, ExtensionContext } from 'vscode';
import { CommandFolder, CommandObject, TopLevelCommands, WorkspaceCommand } from './types';
import { deepCopy, forEachCommand, uniqueId } from './utils';

export const workspaceContextKey = 'usernamehw.commands.workspaceId';

export function getWorkspaceId(context: ExtensionContext): string | undefined {
	return context.workspaceState.get<string>('workspaceId');
}

export async function setWorkspaceIdToContext(context: ExtensionContext): Promise<string> {
	let maybeWorkspaceId = getWorkspaceId(context);
	if (!maybeWorkspaceId) {
		maybeWorkspaceId = uniqueId();
		await context.workspaceState.update('workspaceId', maybeWorkspaceId);
	}
	const workspaceId = maybeWorkspaceId;
	await commands.executeCommand('setContext', workspaceContextKey, workspaceId);
	return workspaceId;
}

export function isWorkspaceCommandItem(item: any): item is (CommandFolder & WorkspaceCommand) | (CommandObject & WorkspaceCommand) {
	return item.workspace !== undefined;
}

export function addWorkspaceIdToCommands(items: TopLevelCommands, workspaceId: string) {
	const itemsDeepCopy = deepCopy(items);
	forEachCommand(item => {
		item.workspace = workspaceId;
	}, itemsDeepCopy);
	return itemsDeepCopy;
}
