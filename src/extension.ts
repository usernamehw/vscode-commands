import { ExtensionContext, window, workspace } from 'vscode';
import { updateCommandPalette } from './commandPalette';
import { registerExtensionCommands } from './commands';
import { updateDocumentLinkProvider } from './documentLinksProvider';
import { VSCodeCommandWithoutCategory } from './quickPick';
import { updateUserCommands } from './registerUserCommands';
import { updateStatusBarItems } from './statusBar';
import { CommandsTreeViewProvider } from './TreeViewProvider';
import { ExtensionConfig, Runnable, TopLevelCommands } from './types';
import { addWorkspaceIdToCommands, getWorkspaceId, setWorkspaceIdToContext } from './workspaceCommands';

export const enum Constants {
	ExtensionId = 'usernamehw.commands',
	ExtensionName = 'commands',
	CommandsSettingId = 'commands.commands',
	WorkspaceCommandsSettingId = 'commands.workspaceCommands',

	CommandPaletteWasPopulatedStorageKey = 'was_populated',
}

/** extension config */
export let $config: ExtensionConfig;
/** extension state */
export class $state {
	static lastExecutedCommand: Runnable = { command: 'noop' };
	static extensionContext: ExtensionContext;
	/**
	 * Cache all Command Palette commands for `quickPickIncludeAllCommands` feature.
	 */
	static allCommandPaletteCommands: VSCodeCommandWithoutCategory[] = [];
}

export async function activate(extensionContext: ExtensionContext) {
	$state.extensionContext = extensionContext;

	updateConfig();

	const commandsTreeViewProvider = new CommandsTreeViewProvider({});
	const commandsTreeView = window.createTreeView(`${Constants.ExtensionName}.tree`, {
		treeDataProvider: commandsTreeViewProvider,
		showCollapseAll: true,
	});


	registerExtensionCommands();

	await setWorkspaceIdToContext(extensionContext);
	updateEverything(getWorkspaceId(extensionContext));

	function updateConfig() {
		$config = workspace.getConfiguration(Constants.ExtensionName) as any as ExtensionConfig;
	}

	function updateEverything(workspaceId?: string) {
		const commands = allCommands(workspaceId);
		commandsTreeViewProvider.updateCommands(commands);
		commandsTreeViewProvider.refresh();
		updateUserCommands(commands);
		updateStatusBarItems(commands);
		updateCommandPalette(commands, extensionContext);
		updateDocumentLinkProvider();
	}

	extensionContext.subscriptions.push(commandsTreeView);
	extensionContext.subscriptions.push(workspace.onDidChangeConfiguration(e => {
		if (!e.affectsConfiguration(Constants.ExtensionName)) {
			return;
		}
		updateConfig();
		updateEverything(getWorkspaceId(extensionContext));
	}));
}

/** Merge global and workspace commands */
export function allCommands(workspaceId: string | undefined): TopLevelCommands {
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
