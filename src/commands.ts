import { commands, ConfigurationTarget, env, languages, Uri, window, workspace } from 'vscode';
import { extensionConfig, EXTENSION_NAME, RUN_COMMAND_ID } from './extension';
import { run } from './run';
import { RunCommandTreeItem } from './TreeViewProvider';
import { CommandObject, IToggleSetting, Runnable, TopLevelCommands } from './types';
import { goToSymbol, isSimpleObject, openKeybindingsGuiAt, openSettingGuiAt } from './utils';

export function registerExtensionCommands() {
	// ──────────────────────────────────────────────────────────────────────
	// ──── Core commands ───────────────────────────────────────────────────
	// ──────────────────────────────────────────────────────────────────────
	commands.registerCommand(RUN_COMMAND_ID, async (runnable: Runnable) => {
		await run(runnable);
	});
	commands.registerTextEditorCommand(`${EXTENSION_NAME}.suggestCommands`, async editor => {
		const allCommands = await commands.getCommands();
		const picked = await window.showQuickPick(allCommands.filter(c => c[0] !== '_'));
		if (!picked) {
			return;
		}
		editor.edit(builder => {
			builder.insert(editor.selection.active, picked);
		});
	});
	commands.registerCommand(`${EXTENSION_NAME}.revealCommand`, async (commandTreeItem: RunCommandTreeItem) => {
		const symbolName = commandTreeItem.getLabelName();
		await commands.executeCommand('workbench.action.openSettingsJson');
		const activeTextEditor = window.activeTextEditor;
		if (!activeTextEditor) {
			return;
		}
		goToSymbol(activeTextEditor, symbolName);
	});
	commands.registerCommand(`${EXTENSION_NAME}.assignKeybinding`, (commandTreeItem: RunCommandTreeItem) => {
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
	commands.registerCommand(`${EXTENSION_NAME}.addToStatusBar`, async (treeItem: RunCommandTreeItem) => {
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

		updateSetting(`${EXTENSION_NAME}.${EXTENSION_NAME}`, configCommands, 'global');
	});
	commands.registerCommand(`${EXTENSION_NAME}.revealCommandsInSettignsGUI`, () => {
		openSettingGuiAt(`@ext:usernamehw.commands`);
	});
	commands.registerCommand(`${EXTENSION_NAME}.openAsQuickPick`, async () => {
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
	// ──────────────────────────────────────────────────────────────────────
	// ──── Additional Commands ─────────────────────────────────────────────
	// ──────────────────────────────────────────────────────────────────────
	commands.registerCommand(`${EXTENSION_NAME}.toggleSetting`, (arg: IToggleSetting | string) => {
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
	commands.registerCommand(`${EXTENSION_NAME}.incrementSetting`, (arg: IToggleSetting | string) => {
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
	commands.registerCommand(`${EXTENSION_NAME}.clipboardWrite`, async (text: string) => {
		if (typeof text !== 'string') {
			window.showErrorMessage('Argument is not a string.');
			return;
		}
		await env.clipboard.writeText(text);
	});
	commands.registerCommand(`${EXTENSION_NAME}.setEditorLanguage`, async (languageId: string) => {
		if (typeof languageId !== 'string') {
			window.showErrorMessage('Argument is not a string.');
			return;
		}
		if (!window.activeTextEditor) {
			return;
		}
		await languages.setTextDocumentLanguage(window.activeTextEditor.document, languageId);
	});
	commands.registerCommand(`${EXTENSION_NAME}.openFolder`, async (path: string) => {
		await commands.executeCommand('vscode.openFolder', Uri.file(path));
	});
	commands.registerCommand(`${EXTENSION_NAME}.showNotification`, (messageArg: string | { message: string; severity?: 'error' | 'info' | 'warning' }) => {
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
/**
 * TODO: use this function in other places
 */
async function updateSetting(settingName: string, newValue: unknown, target: 'global' | 'workspace') {
	const settings = workspace.getConfiguration(undefined, null);
	const configurationTarget = target === 'workspace' ? ConfigurationTarget.Workspace : ConfigurationTarget.Global;
	await settings.update(settingName, newValue, configurationTarget);
}
