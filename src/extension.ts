import { ExtensionContext, TreeView, window, workspace } from 'vscode';
import { updateCommandPalette } from './commandPalette';
import { registerExtensionCommands } from './commands';
import { updateDocumentLinkProvider } from './documentLinksProvider';
import { getKeybindings, VSCodeKeybindingItem } from './getKeybindings';
import { registerJsonSchemaCompletion } from './keybindingsCompletions';
import { VSCodeCommandWithoutCategory } from './quickPick';
import { updateUserCommands } from './registerUserCommands';
import { updateStatusBarItems, updateStatusBarItemsVisibilityBasedOnActiveEditor } from './statusBar';
import { CommandsTreeViewProvider, FolderTreeItem, RunCommandTreeItem } from './TreeViewProvider';
import { ExtensionConfig, Runnable, TopLevelCommands } from './types';
import { addWorkspaceIdToCommands, getWorkspaceId, setWorkspaceIdToContext } from './workspaceCommands';

export const enum Constants {
	ExtensionId = 'usernamehw.commands',
	ExtensionName = 'commands',
	CommandsSettingId = 'commands.commands',
	WorkspaceCommandsSettingId = 'commands.workspaceCommands',

	CommandPaletteWasPopulatedStorageKey = 'was_populated',

	NestingSymbol = '◦',
}

export let $config: ExtensionConfig;
export abstract class $state {
	static lastExecutedCommand: Runnable = { command: 'noop' };
	static context: ExtensionContext;
	/**
	 * Cache all Command Palette commands for `quickPickIncludeAllCommands` feature.
	 */
	static allCommandPaletteCommands: VSCodeCommandWithoutCategory[] = [];
	static commandsTreeViewProvider: CommandsTreeViewProvider;
	static commandsTreeView: TreeView<FolderTreeItem | RunCommandTreeItem>;
	static keybindings: VSCodeKeybindingItem[] = [];
}

export async function activate(context: ExtensionContext) {
	$state.context = context;

	updateConfig();

	$state.commandsTreeViewProvider = new CommandsTreeViewProvider({});
	$state.commandsTreeView = window.createTreeView(`${Constants.ExtensionName}.tree`, {
		treeDataProvider: $state.commandsTreeViewProvider,
		showCollapseAll: true,
	});


	registerExtensionCommands();

	await setWorkspaceIdToContext(context);
	updateEverything(context);

	setTimeout(registerJsonSchemaCompletion);

	function updateConfig() {
		$config = workspace.getConfiguration(Constants.ExtensionName) as any as ExtensionConfig;
	}

	context.subscriptions.push($state.commandsTreeView);
	context.subscriptions.push(workspace.onDidChangeConfiguration(e => {
		if (!e.affectsConfiguration(Constants.ExtensionName)) {
			return;
		}
		updateConfig();
		updateEverything(context);
	}));

	context.subscriptions.push(window.onDidChangeActiveTextEditor(editor => {
		updateStatusBarItemsVisibilityBasedOnActiveEditor(editor);
	}));
}

/**
 * Function runs after every config update.
 */
async function updateEverything(context: ExtensionContext) {
	const commands = getAllCommands();
	$state.keybindings = [];
	if ($config.showKeybindings) {
		$state.keybindings = await getKeybindings(context);
	}
	$state.commandsTreeViewProvider.updateCommands(commands);
	$state.commandsTreeViewProvider.refresh();
	updateUserCommands(commands);
	updateStatusBarItems(commands);
	updateCommandPalette(commands, context);
	updateDocumentLinkProvider();
}

/**
 * Merge global and workspace commands.
 */
export function getAllCommands(): TopLevelCommands {
	const workspaceId = getWorkspaceId($state.context);
	const workspaceCommands = workspace.getConfiguration(Constants.ExtensionName).inspect('workspaceCommands')?.workspaceValue as ExtensionConfig['workspaceCommands'] | undefined;
	if (workspaceId && workspaceCommands) {
		return {
			...$config.commands,
			...addWorkspaceIdToCommands(workspaceCommands, workspaceId),
		};
	} else {
		return $config.commands;
	}
}

export function deactivate() { }
