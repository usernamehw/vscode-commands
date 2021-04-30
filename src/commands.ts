import { commands, ConfigurationTarget, debug, env, languages, Uri, window, workspace } from 'vscode';
import { Constants, extensionConfig } from './extension';
import { run } from './run';
import { RunCommandTreeItem } from './TreeViewProvider';
import { CommandObject, IToggleSetting, Runnable, TopLevelCommands } from './types';
import { goToSymbol, isSimpleObject, openKeybindingsGuiAt, openSettingGuiAt } from './utils';

export const enum CommandIds {
	// Core
	'run' = 'commands.run',
	'newCommand' = 'commands.newCommand',
	'suggestCommands' = 'commands.suggestCommands',
	'revealCommand' = 'commands.revealCommand',
	'openAsQuickPick' = 'commands.openAsQuickPick',
	'assignKeybinding' = 'commands.assignKeybinding',
	'addToStatusBar' = 'commands.addToStatusBar',
	'revealCommandsInSettignsGUI' = 'commands.revealCommandsInSettignsGUI',
	// Additional
	'toggleSetting' = 'commands.toggleSetting',
	'incrementSetting' = 'commands.incrementSetting',
	'clipboardWrite' = 'commands.clipboardWrite',
	'setEditorLanguage' = 'commands.setEditorLanguage',
	'openFolder' = 'commands.openFolder',
	'showNotification' = 'commands.showNotification',
	'runInTerminal' = 'commands.runInTerminal',
	'startDebugging' = 'commands.startDebugging',
}

export function registerExtensionCommands() {
	// ──────────────────────────────────────────────────────────────────────
	// ──── Core commands ───────────────────────────────────────────────────
	// ──────────────────────────────────────────────────────────────────────
	commands.registerCommand(CommandIds.run, async (runnable: Runnable) => {
		await run(runnable);
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
		const runnable = commandTreeItem.runnable;
		if (Array.isArray(runnable)) {
			window.showWarningMessage('Can only assign keybinding to an object with "registerCommand" key.');
			return;
		}
		if (!runnable.registerCommand) {
			window.showWarningMessage('You need to specify "registerCommand" property to be able to assign this command a keybinding.');// TODO: reveal button
		} else {
			openKeybindingsGuiAt(runnable.registerCommand);
		}
	});
	commands.registerCommand(CommandIds.addToStatusBar, async (treeItem: RunCommandTreeItem) => {
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
		const treeAsOneLevelMap: {
			[key: string]: Runnable;
		} = {};
		function traverseCommands(items: TopLevelCommands): void {
			for (const key in items) {
				const command = items[key];
				if (command.nestedItems) {
					traverseCommands(command.nestedItems);
				} else {
					treeAsOneLevelMap[key] = command;
				}
			}
		}
		traverseCommands(extensionConfig.commands);
		const pickedCommandTitle = await window.showQuickPick(Object.keys(treeAsOneLevelMap));
		if (pickedCommandTitle) {
			run(treeAsOneLevelMap[pickedCommandTitle]);
		}
	});
	commands.registerCommand(CommandIds.newCommand, async () => {
		const pickedCommand = await window.showQuickPick(await getAllVscodeCommands());
		if (!pickedCommand) {
			return;
		}
		// @ts-ignore
		const newCommandsSetting: TopLevelCommands = {
			...extensionConfig.commands,
			...{
				[pickedCommand]: {
					command: pickedCommand,
				},
			},
		};
		await updateSetting(Constants.commandsSettingId, newCommandsSetting, 'global');
		await openSettingsJSON();
		await goToSymbol(window.activeTextEditor!, pickedCommand);
	});
	// ──────────────────────────────────────────────────────────────────────
	// ──── Additional Commands ─────────────────────────────────────────────
	// ──────────────────────────────────────────────────────────────────────
	commands.registerCommand(CommandIds.toggleSetting, (arg: IToggleSetting | string) => {
		const settings = workspace.getConfiguration(undefined, null);

		if (typeof arg === 'string') {
		// Passed only string, assume that's a boolean settings' name and try to toggle it
			const currentSettingValue = settings.get<any>(arg);
			if (typeof currentSettingValue !== 'boolean') {
				window.showWarningMessage('Passing a string only works with type Boolean');
				return;
			}
			settings.update(arg, !currentSettingValue, true);
		} else if (isSimpleObject(arg)) {
			const settingName = arg.setting;
			const currentSettingValue = settings.get(settingName);
			const settingValues = arg.value;

			if (Array.isArray(settingValues)) {
				const next = getNextOrFirstElement(settingValues, currentSettingValue);
				settings.update(settingName, next, true);
			} else if (typeof settingValues === 'string') {
			// Handle comma separated string here (assume it's an array of strings)
				if (settingValues.indexOf(',')) {
					const allValues = settingValues.split(',');
					if (allValues.length === 1) {
						settings.update(settingName, allValues[0], true);
					} else {
						const next = getNextOrFirstElement(allValues, currentSettingValue);
						settings.update(settingName, next, true);
					}
				}
			}
		}
		function getNextOrFirstElement<T>(arr: T[], target: any): T {
			const idx = arr.findIndex(el => el === target);
			return idx === arr.length - 1 ? arr[0] : arr[idx + 1];
		}
	});
	commands.registerCommand(CommandIds.incrementSetting, (arg: IToggleSetting | string) => {
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
	// commands.registerCommand(`${EXTENSION_NAME}.settingsMerge`, (arg: any) => {
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
}
// ──────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────
function incrementSetting(settingName: any, n: any): void {
	if (typeof settingName !== 'string') {
		window.showWarningMessage('Setting name must be a string');
		return;
	}
	if (typeof n !== 'number' || isNaN(n)) {
		window.showWarningMessage('Only numbers allowed');
		return;
	}
	const settings = workspace.getConfiguration(undefined, null);
	const currentSettingValue = settings.get<any>(settingName);
	if (typeof currentSettingValue !== 'number') {
		window.showWarningMessage('Only works for settings of type `number`');
		return;
	}
	settings.update(settingName, currentSettingValue + n, true);
}
async function updateSetting(settingName: string, newValue: unknown, target: 'global' | 'workspace') {
	const settings = workspace.getConfiguration(undefined, null);
	const configurationTarget = target === 'workspace' ? ConfigurationTarget.Workspace : ConfigurationTarget.Global;
	await settings.update(settingName, newValue, configurationTarget);
}

export async function getAllVscodeCommands() {
	const allCommands = await commands.getCommands();
	return allCommands.filter(c => c[0] !== '_');// remove internal commands
}

export async function openSettingsJSON() {
	return await commands.executeCommand('workbench.action.openSettingsJson');
}
