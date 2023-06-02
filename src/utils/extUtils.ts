import { $config, Constants } from '../extension';
import { FolderTreeItem, RunCommandTreeItem } from '../TreeViewProvider';
import { type CommandFolder, type Sequence, type TopLevelCommands, type TopLevelItem } from '../types';
import { isWorkspaceCommandItem } from '../workspaceCommands';

function isCommandFolder(item: Sequence | TopLevelItem): item is CommandFolder {
	return typeof item !== 'string' && ('nestedItems' as keyof CommandFolder) in item;
}

/**
 * Walk over all items (commands and folders) from the main setting `commands.commands`/`commands.workspaceCommands`
 * and execute callback for each item.
 */
function forEachCommand(
	callback: (item: TopLevelCommands[string], key: string, parentElement: TopLevelCommands)=> void,
	items: TopLevelCommands,
): void {
	for (const [key, item] of Object.entries(items)) {
		callback(item, key, items);

		if (isCommandFolder(item)) {
			forEachCommand(callback, item.nestedItems);
		}
	}
}

type TopLevelCommandNoFolders = Record<string, Exclude<TopLevelItem, CommandFolder>>;
/**
 * Given folder - return all nested commands (not folders).
 */
function getAllNestedCommands(folder: CommandFolder): TopLevelCommandNoFolders {
	if (!folder.nestedItems) {
		throw Error(`Not a folder: ${JSON.stringify(folder)}`);
	}

	const allNestedCommands: TopLevelCommandNoFolders = {};

	forEachCommand((item, key) => {
		if (isCommandFolder(item)) {
			return;
		}
		allNestedCommands[key] = item;
	}, folder.nestedItems);

	return allNestedCommands;
}

function isWorkspaceTreeItem(treeItem: FolderTreeItem | RunCommandTreeItem): boolean {
	return (treeItem instanceof RunCommandTreeItem && isWorkspaceCommandItem(treeItem.runnable)) ||
		(treeItem instanceof FolderTreeItem && isWorkspaceCommandItem(treeItem.folder));
}

function applyForTreeItem(
	action: (o: { treeItem: FolderTreeItem | RunCommandTreeItem; commands: TopLevelCommands; settingId: string; configTarget: 'global' | 'workspace' })=> void,
	treeItem: FolderTreeItem | RunCommandTreeItem,
): void {
	if (isWorkspaceTreeItem(treeItem)) {
		action({ treeItem, commands: $config.workspaceCommands, settingId: Constants.WorkspaceCommandsSettingId, configTarget: 'workspace' });
	} else {
		action({ treeItem, commands: $config.commands, settingId: Constants.ExtensionMainSettingId, configTarget: 'global' });
	}
}
/**
 * Transform
 * `"variable"`
 * into
 * `"${variable}"`.
 */
function wrapVariable(variableName: string): string {
	return `\${${variableName}}`;
}

export const extUtils = {
	isCommandFolder,
	forEachCommand,
	getAllNestedCommands,
	isWorkspaceTreeItem,
	applyForTreeItem,
	wrapVariable,
};
