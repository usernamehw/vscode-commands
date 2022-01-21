import { ExtensionContext, window, workspace } from 'vscode';
import { updateCommandPalette } from './commandPalette';
import { registerExtensionCommands } from './commands';
import { updateDocumentLinkProvider } from './documentLinksProvider';
import { updateUserCommands } from './registerUserCommands';
import { updateStatusBarItems } from './statusBar';
import { CommandsTreeViewProvider } from './TreeViewProvider';
import { ExtensionConfig, Runnable } from './types';
import { addWorkspaceIdToCommands, getWorkspaceId, setWorkspaceIdToContext } from './workspaceCommands';

export const enum Constants {
	extensionId = 'usernamehw.commands',
	extensionName = 'commands',
	commandsSettingId = 'commands.commands',
	workspaceCommandsSettingId = 'commands.workspaceCommands',
	treeViewStatusBarIndicator = '💠',

	COMMAND_PALETTE_WAS_POPULATED_STORAGE_KEY = 'was_populated',
}

export let extensionConfig: ExtensionConfig;
export class extensionState {
	static lastExecutedCommand: Runnable = { command: 'noop' };
}

export function activate(extensionContext: ExtensionContext) {
	updateConfig();

	const commandsTreeViewProvider = new CommandsTreeViewProvider({});
	const commandsTreeView = window.createTreeView(`${Constants.extensionName}.tree`, {
		treeDataProvider: commandsTreeViewProvider,
		showCollapseAll: true,
	});

	setWorkspaceIdToContext(extensionContext).then(updateEverything);

	registerExtensionCommands();

	function updateConfig() {
		extensionConfig = workspace.getConfiguration(Constants.extensionName) as any as ExtensionConfig;
	}

	function allCommands(workspaceId?: string) {
		let commands = extensionConfig.commands;
		if (workspaceId) {
			commands = {
				...commands,
				...addWorkspaceIdToCommands(extensionConfig.workspaceCommands, workspaceId),
			};
		}
		return commands;
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
		if (!e.affectsConfiguration(Constants.extensionName)) {
			return;
		}
		updateConfig();
		updateEverything(getWorkspaceId(extensionContext));
	}));
}

export function deactivate() { }
