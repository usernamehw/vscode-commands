import { commands } from 'vscode';
import { assignKeybindingCommand } from './commands/assignKeybindingCommand';
import { clipboardWriteCommand } from './commands/clipboardWriteCommand';
import { deleteCommandCommand } from './commands/deleteCommandCommand';
import { escapeCommandUriArgumentCommand } from './commands/escapeCommandUriArgumentCommand';
import { focusTerminalCommand } from './commands/focusTerminalCommand';
import { incrementSettingCommand } from './commands/incrementSettingCommand';
import { newCommandCommand, newCommandInFolderCommand } from './commands/newCommandCommand';
import { newFolderCommand } from './commands/newFolderCommand';
import { newFolderInFolderCommand } from './commands/newFolderInFolderCommand';
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
import { suggestCodiconsCommand } from './commands/suggestCodiconsCommand';
import { suggestCommandsCommand } from './commands/suggestCommandsCommand';
import { suggestVariableCommand } from './commands/suggestVariableCommand';
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
export const enum CommandId {
	// ──── Core ──────────────────────────────────────────────────
	Run = 'commands.run',
	Rerun = 'commands.rerun',
	SelectAndRun = 'commands.selectAndRun',
	NewCommand = 'commands.newCommand',
	NewFolder = 'commands.newFolder',
	DeleteCommand = 'commands.deleteCommand',
	SuggestCommands = 'commands.suggestCommands',
	SuggestCodicons = 'commands.suggestCodicons',
	SuggestVariables = 'commands.suggestVariables',
	RevealCommand = 'commands.revealCommand',
	RevealCommand2 = 'commands.revealCommand2',
	OpenAsQuickPick = 'commands.openAsQuickPick',
	AssignKeybinding = 'commands.assignKeybinding',
	ToggleStatusBar = 'commands.addToStatusBar',
	NewFolderInFolder = 'commands.newFolderInFolder',
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
	FocusTerminal = 'commands.focusTerminal',
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
	commands.registerCommand(CommandId.Run, runCommand);
	commands.registerCommand(CommandId.Rerun, rerunCommand);
	commands.registerCommand(CommandId.SelectAndRun, selectAndRunCommand);
	commands.registerCommand(CommandId.RevealCommand, revealCommandCommand);
	commands.registerCommand(CommandId.RevealCommand2, revealCommand2Command);
	commands.registerCommand(CommandId.AssignKeybinding, assignKeybindingCommand);
	commands.registerCommand(CommandId.ToggleStatusBar, toggleStatusBarCommand);
	commands.registerCommand(CommandId.RevealCommandsInSettignsGUI, revealCommandsInSettingsGUICommand);
	commands.registerCommand(CommandId.OpenAsQuickPick, openAsQuickPickCommand);
	commands.registerCommand(CommandId.NewCommand, newCommandCommand);
	commands.registerCommand(CommandId.NewFolderInFolder, newFolderInFolderCommand);
	commands.registerCommand(CommandId.NewCommandInFolder, newCommandInFolderCommand);
	commands.registerCommand(CommandId.NewFolder, newFolderCommand);
	commands.registerCommand(CommandId.DeleteCommand, deleteCommandCommand);
	commands.registerTextEditorCommand(CommandId.SuggestCommands, suggestCommandsCommand);
	commands.registerTextEditorCommand(CommandId.SuggestVariables, suggestVariableCommand);
	commands.registerTextEditorCommand(CommandId.SuggestCodicons, suggestCodiconsCommand);
	commands.registerTextEditorCommand(CommandId.EscapeCommandUriArgument, escapeCommandUriArgumentCommand);
	// ──── Additional Commands ───────────────────────────────────
	commands.registerCommand(CommandId.ToggleSetting, toggleSettingCommand);
	commands.registerCommand(CommandId.IncrementSetting, incrementSettingCommand);
	commands.registerCommand(CommandId.ClipboardWrite, clipboardWriteCommand);
	commands.registerCommand(CommandId.SetEditorLanguage, setEditorLanguageCommand);
	commands.registerCommand(CommandId.OpenFolder, openFolderCommand);
	commands.registerCommand(CommandId.ShowNotification, showNotificationCommand);
	commands.registerCommand(CommandId.ShowStatusBarNotification, showStatusBarNotificationCommand);
	commands.registerCommand(CommandId.FocusTerminal, focusTerminalCommand);
	commands.registerCommand(CommandId.RunInTerminal, runInTerminalCommand);
	commands.registerCommand(CommandId.StartDebugging, startDebuggingCommand);
	commands.registerCommand(CommandId.ToggleTheme, toggleThemeCommand);
	commands.registerCommand(CommandId.OpenExternal, openExternalCommand);
	commands.registerCommand(CommandId.RevealFileInOS, revealFileInOSCommand);
	commands.registerCommand(CommandId.Open, openCommand);
}

export function isWorkspaceTreeItem(treeItem: FolderTreeItem | RunCommandTreeItem): boolean {
	return treeItem instanceof RunCommandTreeItem && isWorkspaceCommandItem(treeItem.runnable) ||
		treeItem instanceof FolderTreeItem && isWorkspaceCommandItem(treeItem.folder);
}

export function applyForTreeItem(
	action: (o: { treeItem: FolderTreeItem | RunCommandTreeItem; commands: TopLevelCommands; settingId: string; configTarget: 'global' | 'workspace' })=> any,
	treeItem: FolderTreeItem | RunCommandTreeItem) {
	if (isWorkspaceTreeItem(treeItem)) {
		return action({ treeItem, commands: $config.workspaceCommands, settingId: Constants.WorkspaceCommandsSettingId, configTarget: 'workspace' });
	} else {
		return action({ treeItem, commands: $config.commands, settingId: Constants.CommandsSettingId, configTarget: 'global' });
	}
}
