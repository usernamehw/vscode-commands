import { commands, type ExtensionContext } from 'vscode';
import { extUtils, utils } from './reexport';
import { type CommandFolder, type CommandObject, type TopLevelCommands } from './types';

export const enum WorkspaceConstants {
	StorageKey = 'workspaceId',
	ContextKey = 'usernamehw.commands.workspaceId',
}

export function getWorkspaceId(context: ExtensionContext): string | undefined {
	return context.workspaceState.get<string>(WorkspaceConstants.StorageKey);
}

export async function setWorkspaceIdToContext(context: ExtensionContext): Promise<string> {
	let maybeWorkspaceId = getWorkspaceId(context);
	if (!maybeWorkspaceId) {
		maybeWorkspaceId = utils.uniqueId();
		await context.workspaceState.update(WorkspaceConstants.StorageKey, maybeWorkspaceId);
	}
	const workspaceId = maybeWorkspaceId;
	await commands.executeCommand('setContext', WorkspaceConstants.ContextKey, workspaceId);
	return workspaceId;
}

export function isWorkspaceCommandItem(item: object | string): item is (CommandFolder & WorkspaceCommand) | (CommandObject & WorkspaceCommand) {
	return typeof item !== 'string' &&
		'workspace' in item;
}

export function addWorkspaceIdToCommands(workspaceCommands: TopLevelCommands, workspaceId: string): TopLevelCommands {
	const itemsDeepCopy = utils.deepCopy(workspaceCommands);
	extUtils.forEachCommand(item => {
		if (typeof item !== 'string') {
			item.workspace = workspaceId;
		}
	}, itemsDeepCopy);
	return itemsDeepCopy;
}

interface WorkspaceCommand {
	workspace: string;
}
