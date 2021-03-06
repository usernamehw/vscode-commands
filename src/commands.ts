import { ColorThemeKind, commands, debug, env, languages, Uri, window, workspace } from 'vscode';
import { addArgs } from './args';
import { $config, $state, allCommands, Constants } from './extension';
import { commandsToQuickPickItems, removeCodiconFromLabel, showQuickPick } from './quickPick';
import { run } from './run';
import { incrementSetting, toggleSetting, updateSetting } from './settings';
import { FolderTreeItem, RunCommandTreeItem } from './TreeViewProvider';
import { CommandObject, Runnable, StatusBarNotification, ToggleSetting, TopLevelCommands } from './types';
import { deepCopy, forEachCommand, getAllVscodeCommands, goToSymbol, isSimpleObject, openKeybindingsGuiAt, openSettingGuiAt, openSettingsJSON } from './utils';
import { getWorkspaceId, isWorkspaceCommandItem } from './workspaceCommands';
/**
 * All command ids contributed by this extension.
 */
export const enum CommandIds {
	// ──── Core ────────────────────────────────────────────────────────────
	'Run' = 'commands.run',
	'Rerun' = 'commands.rerun',
	'SelectAndRun' = 'commands.selectAndRun',
	'NewCommand' = 'commands.newCommand',
	'NewFolder' = 'commands.newFolder',
	'DeleteCommand' = 'commands.deleteCommand',
	'SuggestCommands' = 'commands.suggestCommands',
	'RevealCommand' = 'commands.revealCommand',
	'RevealCommand2' = 'commands.revealCommand2',
	'OpenAsQuickPick' = 'commands.openAsQuickPick',
	'SssignKeybinding' = 'commands.assignKeybinding',
	'AddToStatusBar' = 'commands.addToStatusBar',
	'NewCommandInFolder' = 'commands.newCommandInFolder',
	'RevealCommandsInSettignsGUI' = 'commands.revealCommandsInSettignsGUI',
	'EscapeCommandUriArgument' = 'commands.escapeCommandUriArgument',
	// ──── Additional ──────────────────────────────────────────────────────
	'ToggleSetting' = 'commands.toggleSetting',
	'IncrementSetting' = 'commands.incrementSetting',
	'ClipboardWrite' = 'commands.clipboardWrite',
	'SetEditorLanguage' = 'commands.setEditorLanguage',
	'OpenFolder' = 'commands.openFolder',
	'ShowNotification' = 'commands.showNotification',
	'ShowStatusBarNotification' = 'commands.showStatusBarNotification',
	'RunInTerminal' = 'commands.runInTerminal',
	'StartDebugging' = 'commands.startDebugging',
	'ToggleTheme' = 'commands.toggleTheme',
	'OpenExternal' = 'commands.openExternal',
	'RevealFileInOS' = 'commands.revealFileInOS',
	'Open' = 'commands.open',
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
	commands.registerCommand(CommandIds.Run, async (runnable: Runnable) => {
		await run(runnable);
	});
	commands.registerCommand(CommandIds.Rerun, async () => {
		await run($state.lastExecutedCommand);
	});
	commands.registerCommand(CommandIds.SelectAndRun, async () => {
		const pickedCommand = await window.showQuickPick(await getAllVscodeCommands());
		if (!pickedCommand) {
			return;
		}
		await run({
			command: pickedCommand,
		});
	});
	commands.registerTextEditorCommand(CommandIds.SuggestCommands, async editor => {
		const quickPickItems = commandsToQuickPickItems(await getAllVscodeCommands());
		const picked = await window.showQuickPick(quickPickItems);
		if (!picked) {
			return;
		}
		const label = removeCodiconFromLabel(picked.label);
		editor.edit(builder => {
			builder.insert(editor.selection.active, label);
		});
	});
	commands.registerCommand(CommandIds.RevealCommand, (commandTreeItem: RunCommandTreeItem) => {
		const symbolName = commandTreeItem.getLabelName();
		applyForTreeItem(async ({ configTarget }) => {
			await openSettingsJSON(configTarget);
			goToSymbol(window.activeTextEditor, symbolName);
		}, commandTreeItem);
	});
	commands.registerCommand(CommandIds.RevealCommand2, async ({ workspaceId, label }: { workspaceId?: string; label: string }) => {
		await openSettingsJSON(workspaceId ? 'workspace' : 'global');
		goToSymbol(window.activeTextEditor, label);
	});
	commands.registerCommand(CommandIds.SssignKeybinding, (commandTreeItem: RunCommandTreeItem) => {
		openKeybindingsGuiAt(commandTreeItem.getLabelName());
	});
	commands.registerCommand(CommandIds.AddToStatusBar, async (treeItem: FolderTreeItem | RunCommandTreeItem) => {
		const labelName = treeItem.getLabelName();
		let newStatusBarItemText = '';
		if ($config.statusBarDefaultText === 'pick') {
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
		applyForTreeItem(({ commands, settingId, configTarget }) => {
			const configCommands: TopLevelCommands = deepCopy(commands);
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
			updateSetting(settingId, configCommands, configTarget);
		}, treeItem);
		function toggleStatusBarItem(commandObject: CommandObject) {
			if (commandObject.statusBar) {
				commandObject.statusBar.hidden = !commandObject.statusBar.hidden;
			} else {
				commandObject.statusBar = {
					text: newStatusBarItemText,
				};
			}
		}
	});
	commands.registerCommand(CommandIds.RevealCommandsInSettignsGUI, () => {
		openSettingGuiAt(`@ext:${Constants.ExtensionId}`);
	});
	commands.registerCommand(CommandIds.OpenAsQuickPick, () => {
		showQuickPick(allCommands(getWorkspaceId($state.extensionContext)));
	});
	commands.registerCommand(CommandIds.NewCommand, async () => {
		await addNewCommand();
	});
	commands.registerCommand(CommandIds.NewCommandInFolder, async (folderTreeItem: FolderTreeItem) => {
		await addNewCommand(folderTreeItem);
	});
	commands.registerCommand(CommandIds.NewFolder, async () => {
		await newFolder();
	});
	commands.registerCommand(CommandIds.DeleteCommand, async (treeItem: RunCommandTreeItem) => {
		const confirmBtnName = 'Delete';
		const button = await window.showWarningMessage(`Do you want to delete "${treeItem.label}"?\n\n${JSON.stringify(treeItem.runnable, null, '    ')}`, {
			modal: true,
		}, confirmBtnName);
		if (button === confirmBtnName) {
			applyForTreeItem(async ({ treeItem, commands, settingId, configTarget }) => {
				const configCommands: TopLevelCommands = deepCopy(commands);// config is readonly, get a copy
				forEachCommand((item, key, parentElement) => {
					if (key === treeItem.label) {
						delete parentElement[key];
					}
				}, configCommands);
				await updateSetting(settingId, configCommands, configTarget);
			}, treeItem);
		}
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
			...$config.commands,
			...{
				[newFolderName]: {
					nestedItems: {},
				},
			},
		};
		await updateSetting(Constants.CommandsSettingId, newCommandsSetting, 'global');
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
		const label = removeCodiconFromLabel(pickedCommand.label);
		const newCommand = addArgs(label);
		const newCommandKey = `${label}_${Math.random().toString().slice(2, 4)}`;

		if (folderTreeItem) {
			applyForTreeItem(async ({ treeItem, commands, settingId, configTarget }) => {
				const newCommandsSetting: TopLevelCommands = {};
				for (const key in commands) {
					const item = commands[key];
					if (key === treeItem.getLabelName()) {
					// @ts-ignore
						newCommandsSetting[key] = {
							nestedItems: {
								...item.nestedItems,
								...{
									[newCommandKey]: newCommand,
								},
							},
						};
					} else {
						newCommandsSetting[key] = item;
					}
				}
				await updateSetting(settingId, newCommandsSetting, configTarget);
				await openSettingsJSON(configTarget);
				await goToSymbol(window.activeTextEditor, newCommandKey);
			}, folderTreeItem);
		} else {
			const newCommandsSetting = {
				...$config.commands,
				...{
					[newCommandKey]: newCommand,
				},
			};
			await updateSetting(Constants.CommandsSettingId, newCommandsSetting, 'global');
			await openSettingsJSON('global');
			await goToSymbol(window.activeTextEditor, newCommandKey);
		}
	}
	commands.registerTextEditorCommand(CommandIds.EscapeCommandUriArgument, editor => {
		const selectionRange = editor.selection;
		const selectionText = editor.document.getText(selectionRange);
		if (!selectionText) {
			return;
		}
		const escapedArgument = encodeURIComponent(JSON.stringify(selectionText));
		editor.edit(builder => {
			builder.replace(selectionRange, escapedArgument);
		});
	});
	// ──────────────────────────────────────────────────────────────────────
	// ──── Additional Commands ─────────────────────────────────────────────
	// ──────────────────────────────────────────────────────────────────────
	commands.registerCommand(CommandIds.ToggleSetting, async (arg: ToggleSetting | string) => {
		await toggleSetting(arg);
	});
	commands.registerCommand(CommandIds.IncrementSetting, (arg: ToggleSetting | string) => {
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
	commands.registerCommand(CommandIds.ClipboardWrite, async (text: string) => {
		if (typeof text !== 'string') {
			window.showErrorMessage('Argument is not a string.');
			return;
		}
		await env.clipboard.writeText(text);
	});
	commands.registerCommand(CommandIds.SetEditorLanguage, async (languageId: string) => {
		if (typeof languageId !== 'string') {
			window.showErrorMessage('Argument is not a string.');
			return;
		}
		if (!window.activeTextEditor) {
			return;
		}
		await languages.setTextDocumentLanguage(window.activeTextEditor.document, languageId);
	});
	commands.registerCommand(CommandIds.OpenFolder, async (path: string) => {
		await commands.executeCommand('vscode.openFolder', Uri.file(path));
	});
	commands.registerCommand(CommandIds.ShowNotification, (arg: string | { message: string; severity?: 'error' | 'info' | 'warning' }) => {
		if (typeof arg === 'string') {
			window.showInformationMessage(arg);
		} else {
			if (arg.severity === 'error') {
				window.showErrorMessage(arg.message);
			} else if (arg.severity === 'warning') {
				window.showWarningMessage(arg.message);
			} else {
				window.showInformationMessage(arg.message);
			}
		}
	});
	commands.registerCommand(CommandIds.ShowStatusBarNotification, (arg: StatusBarNotification | string) => {
		if (typeof arg === 'string') {
			showTempStatusBarMessage({
				message: arg,
			});
		} else {
			showTempStatusBarMessage(arg);
		}
	});
	commands.registerCommand(CommandIds.RunInTerminal, (arg: string | {text?: string; name?: string; cwd?: string; reveal?: boolean}) => {
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
	commands.registerCommand(CommandIds.StartDebugging, async (name: string) => {
		await debug.startDebugging(workspace.workspaceFolders?.[0], name);
	});
	commands.registerCommand(CommandIds.ToggleTheme, async (themes: { dark: string; light: string}) => {
		await toggleSetting({
			setting: 'workbench.colorTheme',
			value: window.activeColorTheme.kind === ColorThemeKind.Light ? themes.light : themes.dark,
		});
	});
	commands.registerCommand(CommandIds.OpenExternal, async (linkText: string) => {
		await env.openExternal(Uri.parse(linkText));
	});
	commands.registerCommand(CommandIds.RevealFileInOS, async (path: string) => {
		await commands.executeCommand('revealFileInOS', Uri.file(path));
	});
	commands.registerCommand(CommandIds.Open, async (arg: string | { target: string; app: string; arguments?: string[] }) => {
		const open = (await import('open')).default;
		if (typeof arg === 'string') {
			await open(arg);
		} else if (isSimpleObject(arg)) {
			await open(arg.target, {
				app: {
					name: arg.app,
					arguments: arg.arguments || [],
				},
			});
		}
	});
}
// ────────────────────────────────────────────────────────────

function showTempStatusBarMessage(notification: StatusBarNotification) {
	const tempStatusBarMessage = window.createStatusBarItem();
	// tempStatusBarMessage.backgroundColor = new ThemeColor('statusBarItem.errorBackground');
	tempStatusBarMessage.text = notification.message;
	tempStatusBarMessage.color = notification.color;

	tempStatusBarMessage.show();
	setTimeout(() => {
		tempStatusBarMessage.hide();
		tempStatusBarMessage.dispose();
	}, notification.timeout || 4000);
}

function applyForTreeItem(
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
