import { ColorThemeKind, commands, debug, env, languages, Uri, window, workspace } from 'vscode';
import { addArgs } from './args';
import { Constants, extensionConfig } from './extension';
import { commandsToQuickPickItems, showQuickPick } from './quickPick';
import { run } from './run';
import { incrementSetting, toggleSetting, updateSetting } from './settings';
import { FolderTreeItem, RunCommandTreeItem } from './TreeViewProvider';
import { CommandObject, Runnable, ToggleSetting, TopLevelCommands } from './types';
import { getAllVscodeCommands, goToSymbol, isSimpleObject, openKeybindingsGuiAt, openSettingGuiAt, openSettingsJSON } from './utils';
/**
 * All command ids contributed by this extension.
 */
export const enum CommandIds {
	// ──── Core ────────────────────────────────────────────────────────────
	'run' = 'commands.run',
	'selectAndRun' = 'commands.selectAndRun',
	'newCommand' = 'commands.newCommand',
	'newFolder' = 'commands.newFolder',
	'suggestCommands' = 'commands.suggestCommands',
	'revealCommand' = 'commands.revealCommand',
	'openAsQuickPick' = 'commands.openAsQuickPick',
	'assignKeybinding' = 'commands.assignKeybinding',
	'addToStatusBar' = 'commands.addToStatusBar',
	'newCommandInFolder' = 'commands.newCommandInFolder',
	'revealCommandsInSettignsGUI' = 'commands.revealCommandsInSettignsGUI',
	// ──── Additional ──────────────────────────────────────────────────────
	'toggleSetting' = 'commands.toggleSetting',
	'incrementSetting' = 'commands.incrementSetting',
	'clipboardWrite' = 'commands.clipboardWrite',
	'setEditorLanguage' = 'commands.setEditorLanguage',
	'openFolder' = 'commands.openFolder',
	'showNotification' = 'commands.showNotification',
	'runInTerminal' = 'commands.runInTerminal',
	'startDebugging' = 'commands.startDebugging',
	'toggleTheme' = 'commands.toggleTheme',
	'openExternal' = 'commands.openExternal',
	'revealFileInOS' = 'commands.revealFileInOS',
	'open' = 'commands.open',
}
/**
 * Register all commands (core + additional)
 * Core command is needed for this extension to operate
 * Additional commands are just useful commands that accept arguments.
 */
export function registerExtensionCommands() {
	// ──────────────────────────────────────────────────────────────────────
	// ──── Core commands ───────────────────────────────────────────────────
	// ──────────────────────────────────────────────────────────────────────
	commands.registerCommand(CommandIds.run, async (runnable: Runnable) => {
		await run(runnable);
	});
	commands.registerCommand(CommandIds.selectAndRun, async () => {
		const pickedCommand = await window.showQuickPick(await getAllVscodeCommands());
		if (!pickedCommand) {
			return;
		}
		await run({
			command: pickedCommand,
		});
	});
	commands.registerTextEditorCommand(CommandIds.suggestCommands, async editor => {
		const picked = await window.showQuickPick(await getAllVscodeCommands());
		if (!picked) {
			return;
		}
		editor.edit(builder => {
			builder.insert(editor.selection.active, picked);
		});
	});
	commands.registerCommand(CommandIds.revealCommand, async (commandTreeItem: RunCommandTreeItem) => {
		const symbolName = commandTreeItem.getLabelName();
		await openSettingsJSON();
		const activeTextEditor = window.activeTextEditor;
		if (!activeTextEditor) {
			return;
		}
		goToSymbol(activeTextEditor, symbolName);
	});
	commands.registerCommand(CommandIds.assignKeybinding, (commandTreeItem: RunCommandTreeItem) => {
		openKeybindingsGuiAt(commandTreeItem.getLabelName());
	});
	commands.registerCommand(CommandIds.addToStatusBar, async (treeItem: FolderTreeItem | RunCommandTreeItem) => {
		const labelName = treeItem.getLabelName();
		let newStatusBarItemText = '';
		if (extensionConfig.statusBarDefaultText === 'pick') {
			const text = await window.showInputBox({
				prompt: 'Status Bar text',
			});
			if (!text) {
				return;
			}
			newStatusBarItemText = text;
		} else {
			newStatusBarItemText = labelName;
		}
		const configCommands: TopLevelCommands = JSON.parse(JSON.stringify(extensionConfig.commands));// config is readonly, get a copy
		for (const key in configCommands) {
			const commandObject = configCommands[key];
			if (key === labelName) {
				toggleStatusBarItem(commandObject);
				break;
			}
			if (commandObject.nestedItems) {
				for (const key2 in commandObject.nestedItems) {
					const nestedItem = commandObject.nestedItems[key2];
					if (key2 === labelName) {
						toggleStatusBarItem(nestedItem);
						break;
					}
				}
			}
		}
		function toggleStatusBarItem(commandObject: CommandObject) {
			if (commandObject.statusBar) {
				commandObject.statusBar = undefined;
			} else {
				commandObject.statusBar = {
					alignment: extensionConfig.statusBarDefaultPosition,
					text: newStatusBarItemText,
					priority: -9999,
				};
			}
		}

		updateSetting(Constants.commandsSettingId, configCommands, 'global');
	});
	commands.registerCommand(CommandIds.revealCommandsInSettignsGUI, () => {
		openSettingGuiAt(`@ext:usernamehw.commands`);
	});
	commands.registerCommand(CommandIds.openAsQuickPick, async () => {
		await showQuickPick(extensionConfig.commands);
	});
	commands.registerCommand(CommandIds.newCommand, async () => {
		await addNewCommand();
	});
	commands.registerCommand(CommandIds.newCommandInFolder, async (folderTreeItem: FolderTreeItem) => {
		await addNewCommand(folderTreeItem);
	});
	commands.registerCommand(CommandIds.newFolder, async () => {
		await newFolder();
	});
	async function newFolder() {
		const newFolderName = await window.showInputBox({
			title: 'Add folder',
			placeHolder: 'Enter new folder name',
		});
		if (!newFolderName) {
			return;
		}
		const newCommandsSetting = {
			...extensionConfig.commands,
			...{
				[newFolderName]: {
					nestedItems: {},
				},
			},
		};
		await updateSetting(Constants.commandsSettingId, newCommandsSetting, 'global');
	}
	async function addNewCommand(folderTreeItem?: FolderTreeItem) {
		const quickPickItems = commandsToQuickPickItems(await getAllVscodeCommands());
		const quickPickTitle = `Add command to ${folderTreeItem ? `"${folderTreeItem.getLabelName()}"` : 'root'}.`;
		const pickedCommand = await window.showQuickPick(quickPickItems, {
			title: quickPickTitle,
		});
		if (!pickedCommand) {
			return;
		}
		const newCommand = addArgs(pickedCommand.label);

		let newCommandsSetting: TopLevelCommands = {};
		if (folderTreeItem) {
			for (const key in extensionConfig.commands) {
				const item = extensionConfig.commands[key];
				if (key === folderTreeItem.getLabelName()) {
					// @ts-ignore
					newCommandsSetting[key] = {
						nestedItems: {
							...item.nestedItems,
							...{
								[pickedCommand.label]: newCommand,
							},
						},
					};
				} else {
					newCommandsSetting[key] = item;
				}
			}
		} else {
			newCommandsSetting = {
				...extensionConfig.commands,
				...{
					[pickedCommand.label]: newCommand,
				},
			};
		}
		await updateSetting(Constants.commandsSettingId, newCommandsSetting, 'global');
		await openSettingsJSON();
		await goToSymbol(window.activeTextEditor!, pickedCommand.label);
	}
	// ──────────────────────────────────────────────────────────────────────
	// ──── Additional Commands ─────────────────────────────────────────────
	// ──────────────────────────────────────────────────────────────────────
	commands.registerCommand(CommandIds.toggleSetting, async (arg: ToggleSetting | string) => {
		await toggleSetting(arg);
	});
	commands.registerCommand(CommandIds.incrementSetting, (arg: ToggleSetting | string) => {
		let setting;
		let value;
		if (typeof arg === 'string') {
			setting = arg;
		} else if (isSimpleObject(arg)) {
			setting = arg.setting;
			value = arg.value;
		}
		if (typeof value === 'undefined') {
			value = 1;
		}
		incrementSetting(setting, value);
	});
	commands.registerCommand(CommandIds.clipboardWrite, async (text: string) => {
		if (typeof text !== 'string') {
			window.showErrorMessage('Argument is not a string.');
			return;
		}
		await env.clipboard.writeText(text);
	});
	commands.registerCommand(CommandIds.setEditorLanguage, async (languageId: string) => {
		if (typeof languageId !== 'string') {
			window.showErrorMessage('Argument is not a string.');
			return;
		}
		if (!window.activeTextEditor) {
			return;
		}
		await languages.setTextDocumentLanguage(window.activeTextEditor.document, languageId);
	});
	commands.registerCommand(CommandIds.openFolder, async (path: string) => {
		await commands.executeCommand('vscode.openFolder', Uri.file(path));
	});
	commands.registerCommand(CommandIds.showNotification, (messageArg: string | { message: string; severity?: 'error' | 'info' | 'warning' }) => {
		if (typeof messageArg === 'string') {
			window.showInformationMessage(messageArg);
		} else {
			if (messageArg.severity === 'error') {
				window.showErrorMessage(messageArg.message);
			} else if (messageArg.severity === 'warning') {
				window.showWarningMessage(messageArg.message);
			} else {
				window.showInformationMessage(messageArg.message);
			}
		}
	});
	commands.registerCommand(CommandIds.runInTerminal, (arg: string | {text?: string; name?: string; cwd?: string; reveal?: boolean}) => {
		if (typeof arg === 'string') {
			const newTerm = window.createTerminal();
			newTerm.sendText(arg);
			newTerm.show();
		} else {
			if (!arg.text) {
				window.showErrorMessage('No "text" property provided.');
				return;
			}
			const newTerm = window.createTerminal({
				name: arg.name,
				cwd: arg.cwd,
			});
			newTerm.sendText(arg.text);
			if (arg.reveal) {
				newTerm.show();
			}
		}
	});
	commands.registerCommand(CommandIds.startDebugging, async (name: string) => {
		await debug.startDebugging(workspace.workspaceFolders?.[0], name);
	});
	commands.registerCommand(CommandIds.toggleTheme, async (themes: { dark: string; light: string}) => {
		await toggleSetting({
			setting: 'workbench.colorTheme',
			value: window.activeColorTheme.kind === ColorThemeKind.Light ? themes.light : themes.dark,
		});
	});
	commands.registerCommand(CommandIds.openExternal, async (linkText: string) => {
		await env.openExternal(Uri.parse(linkText));
	});
	commands.registerCommand(CommandIds.revealFileInOS, async (path: string) => {
		await commands.executeCommand('revealFileInOS', Uri.file(path));
	});
	commands.registerCommand(CommandIds.open, async (path: string) => {
		const open = (await import('open')).default;
		await open(path);
	});
}
// ────────────────────────────────────────────────────────────


