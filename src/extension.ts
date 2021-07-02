import { ExtensionContext, window, workspace } from 'vscode';
import { updateCommandPalette } from './commandPalette';
import { registerExtensionCommands } from './commands';
import { updateDocumentLinkProvider } from './documentLinksProvider';
import { updateUserCommands } from './registerUserCommands';
import { updateStatusBarItems } from './statusBar';
import { CommandsTreeViewProvider } from './TreeViewProvider';
import { ExtensionConfig } from './types';

export const enum Constants {
	extensionId = 'usernamehw.commands',
	extensionName = 'commands',
	commandsSettingId = 'commands.commands',

	COMMAND_PALETTE_WAS_POPULATED_STORAGE_KEY = 'was_populated',
}

export let extensionConfig: ExtensionConfig;

export function activate(extensionContext: ExtensionContext) {
	updateConfig();

	const commandsTreeViewProvider = new CommandsTreeViewProvider(extensionConfig);
	const commandsTreeView = window.createTreeView(`${Constants.extensionName}.tree`, {
		treeDataProvider: commandsTreeViewProvider,
		showCollapseAll: true,
	});

	updateEverything();

	registerExtensionCommands();

	function updateConfig() {
		extensionConfig = workspace.getConfiguration(Constants.extensionName) as any as ExtensionConfig;
	}

	function updateEverything() {
		commandsTreeViewProvider.updateConfig(extensionConfig);
		commandsTreeViewProvider.refresh();
		updateUserCommands(extensionConfig.commands);
		updateStatusBarItems(extensionConfig.commands);
		updateCommandPalette(extensionConfig.commands, extensionContext);
		updateDocumentLinkProvider();
	}

	extensionContext.subscriptions.push(commandsTreeView);
	extensionContext.subscriptions.push(workspace.onDidChangeConfiguration(e => {
		if (!e.affectsConfiguration(Constants.extensionName)) {
			return;
		}
		updateConfig();
		updateEverything();
	}));
}

export function deactivate() { }
