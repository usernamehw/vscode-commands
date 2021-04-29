import vscode, { ConfigurationChangeEvent, ExtensionContext, workspace } from 'vscode';
import { unregisterCommandPalette, updateCommandPalette } from './commandPalette';
import { registerExtensionCommands } from './commands';
import { registerUserCommands, unregisterUserCommands } from './registerUserCommands';
import { updateStatusBarItems } from './statusBar';
import { CommandsTreeViewProvider } from './TreeViewProvider';
import { ExtensionConfig } from './types';

export const EXTENSION_NAME = 'commands';
export const RUN_COMMAND_ID = `${EXTENSION_NAME}.run`;
export let extensionConfig = workspace.getConfiguration(EXTENSION_NAME) as any as ExtensionConfig;
export const registeredCommandsList: vscode.Disposable[] = [];
export const commandPaletteCommandsList: vscode.Disposable[] = [];
export const statusBarItems: vscode.Disposable[] = [];

export function activate(extensionContext: ExtensionContext) {
	registerExtensionCommands();
	registerUserCommands(extensionConfig.commands);
	updateStatusBarItems(extensionConfig.commands);
	updateCommandPalette(extensionConfig.commands, extensionContext);

	const commandsTreeViewProvider = new CommandsTreeViewProvider(extensionConfig);
	const commandsTreeView = vscode.window.createTreeView(`${EXTENSION_NAME}.tree`, {
		treeDataProvider: commandsTreeViewProvider,
		showCollapseAll: true,
	});

	function updateConfig(e: ConfigurationChangeEvent) {
		if (!e.affectsConfiguration(EXTENSION_NAME)) {
			return;
		}

		extensionConfig = workspace.getConfiguration(EXTENSION_NAME) as any as ExtensionConfig;
		commandsTreeViewProvider.updateConfig(extensionConfig);
		commandsTreeViewProvider.refresh();

		unregisterUserCommands();
		registerUserCommands(extensionConfig.commands);

		updateStatusBarItems(extensionConfig.commands);

		unregisterCommandPalette();
		updateCommandPalette(extensionConfig.commands, extensionContext);
	}

	extensionContext.subscriptions.push(commandsTreeView);
	extensionContext.subscriptions.push(workspace.onDidChangeConfiguration(updateConfig, EXTENSION_NAME));
}

export function deactivate() { }
