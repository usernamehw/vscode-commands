import { commands } from 'vscode';
import { assignKeybindingCommand } from './commands/assignKeybindingCommand';
import { clipboardWriteCommand } from './commands/clipboardWriteCommand';
import { deleteCommandCommand } from './commands/deleteCommandCommand';
import { escapeCommandUriArgumentCommand } from './commands/escapeCommandUriArgumentCommand';
import { incrementSettingCommand } from './commands/incrementSettingCommand';
import { newCommandCommand, newCommandInFolderCommand } from './commands/newCommandCommand';
import { newFolderCommand } from './commands/newFolderCommand';
import { openAsQuickPickCommand } from './commands/openAsQuickPickCommand';
import { openCommand } from './commands/openCommand';
import { openExternalCommand } from './commands/openExternalCommand';
import { openFolderCommand } from './commands/openFolderCommand';
import { rerunCommand } from './commands/rerunCommand';
import { revealCommand2Command, revealCommandCommand } from './commands/revealCommandCommand';
import { revealCommandsInSettingsGUICommand } from './commands/revealCommandsInSettingsGUICommand';
import { revealFileInOSCommand } from './commands/revealFileInOSCommand';
import { runCommand } from './commands/runCommand';
import { runInTerminalCommand } from './commands/runInTerminalCommand';
import { selectAndRunCommand } from './commands/selectAndRunCommand';
import { setEditorLanguageCommand } from './commands/setEditorLanguageCommand';
import { showNotificationCommand } from './commands/showNotificationCommand';
import { showStatusBarNotificationCommand } from './commands/showStatusBarNotificationCommand';
import { startDebuggingCommand } from './commands/startDebuggingCommand';
import { suggestCommandsCommand } from './commands/suggestCommandsCommand';
import { toggleSettingCommand } from './commands/toggleSettingCommand';
import { toggleStatusBarCommand } from './commands/toggleStatusBarCommand';
import { toggleThemeCommand } from './commands/toggleThemeCommand';
import { $config, Constants } from './extension';
import { FolderTreeItem, RunCommandTreeItem } from './TreeViewProvider';
import { TopLevelCommands } from './types';
import { isWorkspaceCommandItem } from './workspaceCommands';

/**
 * All command ids contributed by this extension.
 */
export const enum CommandIds {
	// ──── Core ──────────────────────────────────────────────────
	Run = 'commands.run',
	Rerun = 'commands.rerun',
	SelectAndRun = 'commands.selectAndRun',
	NewCommand = 'commands.newCommand',
	NewFolder = 'commands.newFolder',
	DeleteCommand = 'commands.deleteCommand',
	SuggestCommands = 'commands.suggestCommands',
	RevealCommand = 'commands.revealCommand',
	RevealCommand2 = 'commands.revealCommand2',
	OpenAsQuickPick = 'commands.openAsQuickPick',
	AssignKeybinding = 'commands.assignKeybinding',
	ToggleStatusBar = 'commands.addToStatusBar',
	NewCommandInFolder = 'commands.newCommandInFolder',
	RevealCommandsInSettignsGUI = 'commands.revealCommandsInSettignsGUI',
	EscapeCommandUriArgument = 'commands.escapeCommandUriArgument',
	// ──── Additional ────────────────────────────────────────────
	ToggleSetting = 'commands.toggleSetting',
	IncrementSetting = 'commands.incrementSetting',
	ClipboardWrite = 'commands.clipboardWrite',
	SetEditorLanguage = 'commands.setEditorLanguage',
	OpenFolder = 'commands.openFolder',
	ShowNotification = 'commands.showNotification',
	ShowStatusBarNotification = 'commands.showStatusBarNotification',
	RunInTerminal = 'commands.runInTerminal',
	StartDebugging = 'commands.startDebugging',
	ToggleTheme = 'commands.toggleTheme',
	OpenExternal = 'commands.openExternal',
	RevealFileInOS = 'commands.revealFileInOS',
	Open = 'commands.open',
}
/**
 * Register all commands (core + additional)
 * Core command is needed for this extension to operate
 * Additional commands are just useful commands that accept arguments.
 */
export function registerExtensionCommands() {
	// ──── Core Commands ─────────────────────────────────────────
	commands.registerCommand(CommandIds.Run, runCommand);
	commands.registerCommand(CommandIds.Rerun, rerunCommand);
	commands.registerCommand(CommandIds.SelectAndRun, selectAndRunCommand);
	commands.registerCommand(CommandIds.RevealCommand, revealCommandCommand);
	commands.registerCommand(CommandIds.RevealCommand2, revealCommand2Command);
	commands.registerCommand(CommandIds.AssignKeybinding, assignKeybindingCommand);
	commands.registerCommand(CommandIds.ToggleStatusBar, toggleStatusBarCommand);
	commands.registerCommand(CommandIds.RevealCommandsInSettignsGUI, revealCommandsInSettingsGUICommand);
	commands.registerCommand(CommandIds.OpenAsQuickPick, openAsQuickPickCommand);
	commands.registerCommand(CommandIds.NewCommand, newCommandCommand);
	commands.registerCommand(CommandIds.NewCommandInFolder, newCommandInFolderCommand);
	commands.registerCommand(CommandIds.NewFolder, newFolderCommand);
	commands.registerCommand(CommandIds.DeleteCommand, deleteCommandCommand);
	commands.registerTextEditorCommand(CommandIds.SuggestCommands, suggestCommandsCommand);
	commands.registerTextEditorCommand(CommandIds.EscapeCommandUriArgument, escapeCommandUriArgumentCommand);
	// ──── Additional Commands ───────────────────────────────────
	commands.registerCommand(CommandIds.ToggleSetting, toggleSettingCommand);
	commands.registerCommand(CommandIds.IncrementSetting, incrementSettingCommand);
	commands.registerCommand(CommandIds.ClipboardWrite, clipboardWriteCommand);
	commands.registerCommand(CommandIds.SetEditorLanguage, setEditorLanguageCommand);
	commands.registerCommand(CommandIds.OpenFolder, openFolderCommand);
	commands.registerCommand(CommandIds.ShowNotification, showNotificationCommand);
	commands.registerCommand(CommandIds.ShowStatusBarNotification, showStatusBarNotificationCommand);
	commands.registerCommand(CommandIds.RunInTerminal, runInTerminalCommand);
	commands.registerCommand(CommandIds.StartDebugging, startDebuggingCommand);
	commands.registerCommand(CommandIds.ToggleTheme, toggleThemeCommand);
	commands.registerCommand(CommandIds.OpenExternal, openExternalCommand);
	commands.registerCommand(CommandIds.RevealFileInOS, revealFileInOSCommand);
	commands.registerCommand(CommandIds.Open, openCommand);
}

export function applyForTreeItem(
	action: (o: { treeItem: FolderTreeItem | RunCommandTreeItem; commands: TopLevelCommands; settingId: string; configTarget: 'global' | 'workspace' })=> any,
	treeItem: FolderTreeItem | RunCommandTreeItem) {
	const isWorkspaceTreeItem = (treeItem: FolderTreeItem | RunCommandTreeItem) => treeItem instanceof RunCommandTreeItem && isWorkspaceCommandItem(treeItem.runnable) ||
			treeItem instanceof FolderTreeItem && isWorkspaceCommandItem(treeItem.folder);
	if (isWorkspaceTreeItem(treeItem)) {
		return action({ treeItem, commands: $config.workspaceCommands, settingId: Constants.WorkspaceCommandsSettingId, configTarget: 'workspace' });
	} else {
		return action({ treeItem, commands: $config.commands, settingId: Constants.CommandsSettingId, configTarget: 'global' });
	}
}
