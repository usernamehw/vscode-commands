import vscode, { ConfigurationChangeEvent, ExtensionContext, workspace } from 'vscode';
import { unregisterCommandPalette, updateCommandPalette } from './commandPalette';
import { registerExtensionCommands } from './commands';
import { registerUserCommands, unregisterUserCommands } from './registerUserCommands';
import { updateStatusBarItems } from './statusBar';
import { CommandsTreeViewProvider } from './TreeViewProvider';
import { ExtensionConfig } from './types';

export const enum Constants {
	extensionName = 'commands',
	commandsSettingId = 'commands.commands',
}
export let extensionConfig = workspace.getConfiguration(Constants.extensionName) as any as ExtensionConfig;
export const registeredCommandsList: vscode.Disposable[] = [];
export const commandPaletteCommandsList: vscode.Disposable[] = [];
export const statusBarItems: vscode.Disposable[] = [];

export function activate(extensionContext: ExtensionContext) {
	registerExtensionCommands();
	registerUserCommands(extensionConfig.commands);
	updateStatusBarItems(extensionConfig.commands);
	updateCommandPalette(extensionConfig.commands, extensionContext);

	const commandsTreeViewProvider = new CommandsTreeViewProvider(extensionConfig);
	const commandsTreeView = vscode.window.createTreeView(`${Constants.extensionName}.tree`, {
		treeDataProvider: commandsTreeViewProvider,
		showCollapseAll: true,
	});

	function updateConfig(e: ConfigurationChangeEvent) {
		if (!e.affectsConfiguration(Constants.extensionName)) {
			return;
		}

		extensionConfig = workspace.getConfiguration(Constants.extensionName) as any as ExtensionConfig;
		commandsTreeViewProvider.updateConfig(extensionConfig);
		commandsTreeViewProvider.refresh();

		unregisterUserCommands();
		registerUserCommands(extensionConfig.commands);

		updateStatusBarItems(extensionConfig.commands);

		unregisterCommandPalette();
		updateCommandPalette(extensionConfig.commands, extensionContext);
	}

	extensionContext.subscriptions.push(commandsTreeView);
	extensionContext.subscriptions.push(workspace.onDidChangeConfiguration(updateConfig, Constants.extensionName));
}

export function deactivate() { }
