import { ColorThemeKind, commands, ConfigurationTarget, debug, env, languages, QuickPickItem, Uri, window, workspace } from 'vscode';
import { addArgs, commandArgs } from './args';
import { Constants, extensionConfig } from './extension';
import { showQuickPick } from './quickPick';
import { run } from './run';
import { FolderTreeItem, RunCommandTreeItem } from './TreeViewProvider';
import { CommandObject, Runnable, ToggleSetting, TopLevelCommands } from './types';
import { goToSymbol, isSimpleObject, openKeybindingsGuiAt, openSettingGuiAt, openSettingsJSON } from './utils';
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
	// commands.registerCommand(`${EXTENSION_NAME}.settingsMerge`, (arg: unknown) => {
	// 	if (!isSimpleObject(arg)) {
	// 		window.showWarningMessage('Argument must be an object');
	// 		return;
	// 	}
	// 	const settings = workspace.getConfiguration(undefined, null);
	// 	const settingName = arg.setting;
	// 	if (typeof settingName !== 'string') {
	// 		window.showWarningMessage('Must provide `setting`');
	// 		return;
	// 	}
	// 	const objectToMerge = arg.value;
	// 	if (!isSimpleObject(objectToMerge)) {
	// 		window.showWarningMessage('`value` must be an Object');
	// 		return;
	// 	}
	// 	const oldValue = settings.get(settingName);
	// 	const newValue = merge(oldValue, objectToMerge);
	// 	settings.update(settingName, newValue, true);
	// });
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
// ──────────────────────────────────────────────────────────────────────
/**
 * Toggle global user setting. TODO: move settings to a separate file
 */
async function toggleSetting(arg: ToggleSetting | string) {
	const settings = workspace.getConfiguration(undefined, null);
	let newValue;

	if (typeof arg === 'string') {
		// Passed only string, assume that's a boolean settings' name and try to toggle it
		const currentSettingValue = settings.get<unknown>(arg);
		if (typeof currentSettingValue !== 'boolean') {
			window.showWarningMessage('Passing a string only works with type Boolean');
			return;
		}
		newValue = !currentSettingValue;
	} else if (isSimpleObject(arg)) {
		const settingName = arg.setting;
		const currentSettingValue = settings.get(settingName);
		const settingValues = arg.value;

		if (Array.isArray(settingValues)) {
			newValue = getNextOrFirstElement(settingValues, currentSettingValue);
		} else if (typeof settingValues === 'string') {
			// Handle comma separated string here (assume it's an array of strings)
			if (settingValues.indexOf(',')) {
				const allValues = settingValues.split(',');
				if (allValues.length === 1) {
					newValue = allValues[0];
				} else {
					newValue = getNextOrFirstElement(allValues, currentSettingValue);
				}
			}
		}

		await settings.update(settingName, newValue, ConfigurationTarget.Global);
		if (extensionConfig.toggleSettings.showNotification) {
			window.showInformationMessage(`"${settingName}": ${JSON.stringify(newValue)}`);
		}
	}
}
/**
 * Get next item in array. If there is no next - return the first item.
 */
function getNextOrFirstElement<T>(arr: T[], target: unknown): T {
	const idx = arr.findIndex(el => el === target);
	return idx === arr.length - 1 ? arr[0] : arr[idx + 1];
}
/**
 * Increment global user setting. To decrement - just pass a negative number.
 */
async function incrementSetting(settingName: unknown, n: unknown) {
	if (typeof settingName !== 'string') {
		window.showWarningMessage('Setting name must be a string');
		return;
	}
	if (typeof n !== 'number' || isNaN(n)) {
		window.showWarningMessage('Only numbers allowed');
		return;
	}
	const settings = workspace.getConfiguration(undefined, null);
	const currentSettingValue = settings.get<unknown>(settingName);
	if (typeof currentSettingValue !== 'number') {
		window.showWarningMessage('Only works for settings of type `number`');
		return;
	}
	const newValue = currentSettingValue + n;
	await settings.update(settingName, newValue, true);
	if (extensionConfig.toggleSettings.showNotification) {
		window.showInformationMessage(`"${settingName}": ${JSON.stringify(newValue)}`);
	}
}
/**
 * Update (for now only global) user setting with the new value.
 */
async function updateSetting(settingName: string, newValue: unknown, target: 'global' | 'workspace') {
	const settings = workspace.getConfiguration(undefined, null);
	const configurationTarget = target === 'workspace' ? ConfigurationTarget.Workspace : ConfigurationTarget.Global;
	await settings.update(settingName, newValue, configurationTarget);
}
/**
 * Return all registered vscode commands (excluding internal).
 */
export async function getAllVscodeCommands() {
	return await commands.getCommands(true);
}
/**
 * Convert command ids to {@link QuickPickItem `QuickPickItem[]`}
 */
export function commandsToQuickPickItems(commandList: string[]): QuickPickItem[] {
	const result: QuickPickItem[] = [];
	for (const com of commandList) {
		if (com in commandArgs) {
			result.push({
				label: com,
				detail: 'args',
			});
		} else {
			result.push({
				label: com,
			});
		}
	}
	return result;
}

