import { ConfigurationChangeEvent, Disposable, ExtensionContext, window, workspace } from 'vscode';
import { updateCommandPalette } from './commandPalette';
import { registerExtensionCommands } from './commands';
import { updateUserCommands } from './registerUserCommands';
import { updateStatusBarItems } from './statusBar';
import { CommandsTreeViewProvider } from './TreeViewProvider';
import { ExtensionConfig } from './types';

export const enum Constants {
	extensionName = 'commands',
	commandsSettingId = 'commands.commands',

	COMMAND_PALETTE_WAS_POPULATED_STORAGE_KEY = 'was_populated',
}
export let extensionConfig = workspace.getConfiguration(Constants.extensionName) as any as ExtensionConfig;
export const registeredCommandsList: Disposable[] = [];
export const commandPaletteCommandsList: Disposable[] = [];
export const statusBarItems: Disposable[] = [];

const commandsTreeViewProvider = new CommandsTreeViewProvider(extensionConfig);
const commandsTreeView = window.createTreeView(`${Constants.extensionName}.tree`, {
	treeDataProvider: commandsTreeViewProvider,
	showCollapseAll: true,
});

export function activate(extensionContext: ExtensionContext) {
	registerExtensionCommands();
	updateUserCommands(extensionConfig.commands);
	updateStatusBarItems(extensionConfig.commands);
	updateCommandPalette(extensionConfig.commands, extensionContext);

	function updateConfig(e: ConfigurationChangeEvent) {
		if (!e.affectsConfiguration(Constants.extensionName)) {
			return;
		}

		extensionConfig = workspace.getConfiguration(Constants.extensionName) as any as ExtensionConfig;
		commandsTreeViewProvider.updateConfig(extensionConfig);
		commandsTreeViewProvider.refresh();

		updateUserCommands(extensionConfig.commands);
		updateStatusBarItems(extensionConfig.commands);
		updateCommandPalette(extensionConfig.commands, extensionContext);
	}

	extensionContext.subscriptions.push(commandsTreeView);
	extensionContext.subscriptions.push(workspace.onDidChangeConfiguration(updateConfig, Constants.extensionName));
}

export function deactivate() { }
