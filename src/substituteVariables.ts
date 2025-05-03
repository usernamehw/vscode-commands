import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import { homedir } from 'os';
import path from 'path';
import { commands, env, window, workspace } from 'vscode';
import { type InputPickStringOption, type Inputs, StatusBar } from './types';
import { extUtils } from './utils/extUtils';
import { utils } from './utils/utils';
import { vscodeUtils } from './utils/vscodeUtils';

// https://github.com/microsoft/vscode/blob/main/src/vs/workbench/services/configurationResolver/common/variableResolver.ts
// https://github.com/microsoft/vscode/blob/main/src/vs/editor/contrib/snippet/browser/snippetVariables.ts

// https://github.com/usernamehw/vscode-commands/blob/master/docs/documentation.md#variable-substitution

export const enum VariableNames {
	// ────────────────────────────────────────────────────────────
	// https://code.visualstudio.com/docs/editor/variables-reference
	// ────────────────────────────────────────────────────────────
	UserHome = 'userHome',
	WorkspaceFolder = 'workspaceFolder', // the path of the folder opened in VS Code
	WorkspaceFolderBasename = 'workspaceFolderBasename', // the name of the folder opened in VS Code without any slashes (/)
	File = 'file', // the current opened file (absolute path?)
	FileWorkspaceFolder = 'fileWorkspaceFolder', // the current opened file's workspace folder
	// RelativeFile = 'relativeFile', // the current opened file relative to `workspaceFolder`
	// RelativeFileDirname = 'relativeFileDirname', // the current opened file's dirname relative to `workspaceFolder`
	FileBasename = 'fileBasename', // the current opened file's basename
	FileBasenameNoExtension = 'fileBasenameNoExtension', // the current opened file's basename with no file extension
	FileExtname = 'fileExtname', // the current opened file's extension
	FileDirname = 'fileDirname', // the current opened file's dirname
	// FileDirnameBasename = 'fileDirnameBasename', // the current opened file's folder name
	// cwd = 'cwd}', // the task runner's current working directory on startup
	LineNumber = 'lineNumber', // the current selected line number in the active file
	SelectedText = 'selectedText', // the current selected text in the active file
	ExecPath = 'execPath', //  location of Code.exe
	PathSeparator = 'pathSeparator', // `/` on macOS or linux, `\` on Windows
	PathSeparatorAlias = '/', // alias to pathSeparator
	// ────────────────────────────────────────────────────────────
	// https://code.visualstudio.com/docs/editor/userdefinedsnippets#_variables
	// ────────────────────────────────────────────────────────────
	Clipboard = 'clipboard', // current clipboard value
	Random = 'random', // 6 random Base-10 digits
	RandomHex = 'randomHex', // 6 random Base-16 digits
	CurrentYear = 'currentYear',
	CurrentYearShort = 'currentYearShort',
	CurrentMonth = 'currentMonth',
	CurrentMonthName = 'currentMonthName',
	CurrentMonthNameShort = 'currentMonthNameShort',
	CurrentDate = 'currentDate',
	CurrentDayName = 'currentDayName',
	CurrentDayNameShort = 'currentDayNameShort',
	CurrentHour = 'currentHour',
	CurrentMinute = 'currentMinute',
	CurrentSecond = 'currentSecond',
	CurrentSecondsUnix = 'currentSecondsUnix',
	CurrentTimezoneOffset = 'currentTimezoneOffset',
	// ────────────────────────────────────────────────────────────
	// ──── Additional ────────────────────────────────────────────
	// ────────────────────────────────────────────────────────────
	SelectedLineCount = 'selectedLineCount', // number of selected lines in the active file
	EnvironmentVariablePrefix = 'env:',
	ConfigurationVariablePrefix = 'config:',
	CommandVariablePrefix = 'command:',
	InputVariablePrefix = 'input:',
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/**
 * Try to emulate variable substitution in tasks https://code.visualstudio.com/docs/editor/variables-reference
 *
 * TODO: throw errors (window.showMessage) when variable exists but can't resolve
 */
export async function substituteVariables({
	strArg,
	inputs,
	replaceVariableValue,
}: {
	strArg: string;
	inputs: Inputs | undefined;
	replaceVariableValue?: StatusBar['replaceVariableValue'];
}): Promise<boolean | number | string> {
	if (isSingleVariable(strArg)) {
		return replaceSingleVariable({
			variableName: strArg.slice(2, -1),
			inputs,
			replaceVariableValue,
		});
	}
	const replacedString = await utils.replaceAsync(strArg, /\$\{[^}]+\}/giu, async match => {
		const variableName = match.slice(2, -1);// Remove `${` and `}` from match
		return String(await replaceSingleVariable({
			variableName,
			inputs,
			replaceVariableValue,
		}));
	});

	return replacedString;
}
/**
 * Return true when string contains only 1 varialbe.
 */
function isSingleVariable(text: string): boolean {
	if (text.startsWith('${') && text.endsWith('}')) {
		const variableText = text.slice(2, -1);
		if (variableText.includes('${') &&
			variableText.includes('}')) {
			return false;
		}
		return true;
	}
	return false;
}

async function replaceSingleVariable({
	variableName,
	inputs,
	replaceVariableValue,
}: {
	variableName: string;
	inputs: Inputs | undefined;
	replaceVariableValue: StatusBar['replaceVariableValue'] | undefined;
}): Promise<boolean | number | string> {
	const activeTextEditor = window.activeTextEditor;
	const workspaceFolderFsPath = workspace.workspaceFolders?.[0].uri.fsPath;
	let replacedValue = `\${${variableName}}`;
	let isConfigVariable = false;

	switch (variableName) {
		case VariableNames.SelectedText: {
			if (!activeTextEditor) {
				break;
			}
			const selectedText = activeTextEditor.document.getText(activeTextEditor.selection);
			replacedValue = selectedText;
			break;
		}
		case VariableNames.LineNumber: {
			if (!activeTextEditor) {
				break;
			}
			replacedValue = String(activeTextEditor.selection.active.line + 1);
			break;
		}
		case VariableNames.SelectedLineCount: {
			if (!activeTextEditor) {
				break;
			}
			const selectedLineCount = vscodeUtils.getSelectedLineNumbers(activeTextEditor).length;
			replacedValue = selectedLineCount > 1 ? String(selectedLineCount) : '';
			break;
		}
		case VariableNames.PathSeparator:
		case VariableNames.PathSeparatorAlias: {
			replacedValue = path.sep;
			break;
		}
		case VariableNames.ExecPath: {
			replacedValue = env.appRoot;
			break;
		}
		case VariableNames.UserHome: {
			replacedValue = homedir();
			break;
		}
		case VariableNames.File: {
			if (!activeTextEditor) {
				break;
			}
			replacedValue = activeTextEditor.document.uri.fsPath;
			break;
		}
		case VariableNames.FileBasename: {
			if (!activeTextEditor) {
				break;
			}
			replacedValue = path.basename(activeTextEditor.document.uri.fsPath);
			break;
		}
		case VariableNames.FileBasenameNoExtension: {
			if (!activeTextEditor) {
				break;
			}
			replacedValue = path.basename(activeTextEditor.document.uri.fsPath, path.extname(activeTextEditor.document.uri.fsPath));
			break;
		}
		case VariableNames.FileExtname: {
			if (!activeTextEditor) {
				break;
			}
			replacedValue = path.extname(activeTextEditor.document.uri.fsPath);
			break;
		}
		case VariableNames.FileDirname: {
			if (!activeTextEditor) {
				break;
			}
			replacedValue = path.dirname(activeTextEditor.document.uri.fsPath);
			break;
		}
		case VariableNames.WorkspaceFolder: {
			if (!workspaceFolderFsPath) {
				break;
			}
			replacedValue = workspaceFolderFsPath;
			break;
		}
		case VariableNames.WorkspaceFolderBasename: {
			if (!workspaceFolderFsPath) {
				break;
			}
			replacedValue = path.basename(workspaceFolderFsPath);
			break;
		}
		case VariableNames.FileWorkspaceFolder: {
			if (!activeTextEditor || !workspaceFolderFsPath) {
				break;
			}
			const fileWorkspaceFolder = workspace.getWorkspaceFolder(activeTextEditor.document.uri)?.uri.fsPath;
			if (fileWorkspaceFolder) {
				replacedValue = fileWorkspaceFolder;
				break;
			}
			break;
		}
		case VariableNames.Random: {
			replacedValue = String(Math.random()).slice(2, 8);
			break;
		}
		case VariableNames.RandomHex: {
			replacedValue = Math.random().toString(16).slice(2, 8);
			break;
		}
		case VariableNames.Clipboard: {
			replacedValue = await env.clipboard.readText();
			break;
		}
		case VariableNames.CurrentYear: {
			replacedValue = String(new Date().getFullYear());
			break;
		}
		case VariableNames.CurrentYearShort: {
			replacedValue = String(new Date().getFullYear()).slice(-2);
			break;
		}
		case VariableNames.CurrentMonth: {
			replacedValue = String(new Date().getMonth().valueOf() + 1).padStart(2, '0');
			break;
		}
		case VariableNames.CurrentDate: {
			replacedValue = String(new Date().getDate().valueOf()).padStart(2, '0');
			break;
		}
		case VariableNames.CurrentHour: {
			replacedValue = String(new Date().getHours().valueOf()).padStart(2, '0');
			break;
		}
		case VariableNames.CurrentMinute: {
			replacedValue = String(new Date().getMinutes().valueOf()).padStart(2, '0');
			break;
		}
		case VariableNames.CurrentSecond: {
			replacedValue = String(new Date().getSeconds().valueOf()).padStart(2, '0');
			break;
		}
		case VariableNames.CurrentDayName: {
			replacedValue = dayNames[new Date().getDay()];
			break;
		}
		case VariableNames.CurrentDayNameShort: {
			replacedValue = dayNamesShort[new Date().getDay()];
			break;
		}
		case VariableNames.CurrentMonthName: {
			replacedValue = monthNames[new Date().getMonth()];
			break;
		}
		case VariableNames.CurrentMonthNameShort: {
			replacedValue = monthNamesShort[new Date().getMonth()];
			break;
		}
		case VariableNames.CurrentSecondsUnix: {
			replacedValue = String(Math.floor(new Date().getTime() / 1000));
			break;
		}
		case VariableNames.CurrentTimezoneOffset: {
			const rawTimeOffset = new Date().getTimezoneOffset();
			const sign = rawTimeOffset > 0 ? '-' : '+';
			const hours = Math.trunc(Math.abs(rawTimeOffset / 60));
			const hoursString = (hours < 10 ? `0${hours}` : String(hours));
			const minutes = Math.abs(rawTimeOffset) - (hours * 60);
			const minutesString = (minutes < 10 ? `0${minutes}` : minutes);
			const offset = `${sign + hoursString}:${minutesString}`;
			replacedValue = offset;
			break;
		}
		default: {
			if (variableName.startsWith(VariableNames.EnvironmentVariablePrefix)) {
				const environmentVariableName = variableName.slice(VariableNames.EnvironmentVariablePrefix.length);
				const environmentVariableValue = process.env[environmentVariableName];
				if (environmentVariableValue === undefined) {
					break;
				}
				replacedValue = environmentVariableValue;
				break;
			}
			if (variableName.startsWith(VariableNames.ConfigurationVariablePrefix)) {
				const configVariableName = variableName.slice(VariableNames.ConfigurationVariablePrefix.length);
				replacedValue = replaceConfigurationVariable(configVariableName, replaceVariableValue);
				isConfigVariable = true;
				break;
			}
			if (variableName.startsWith(VariableNames.CommandVariablePrefix)) {
				const commandVarialbeName = variableName.slice(VariableNames.CommandVariablePrefix.length);
				replacedValue = await replaceCommandVariable(commandVarialbeName, undefined);
				break;
			}
			if (variableName.startsWith(VariableNames.InputVariablePrefix)) {
				const inputVariableName = variableName.slice(VariableNames.InputVariablePrefix.length);
				const inputVariableValue = await replaceInputVariable(inputVariableName, inputs);
				if (inputVariableValue === undefined) {
					break;
				}
				replacedValue = String(inputVariableValue);
				break;
			}
			console.error(`Commands: Unknown variable name: "${variableName}".`);
		}
	}

	if (replaceVariableValue) {
		replacedValue = processVariableValue({
			replaceVariableValue,
			variableName,
			variableValue: replacedValue,
			isConfigVariable,
		});
	}

	return replacedValue;
}
function processVariableValue({
	variableName,
	variableValue,
	replaceVariableValue,
	isConfigVariable,
}: {
	variableName: string;
	variableValue: string;
	replaceVariableValue: NonNullable<StatusBar['replaceVariableValue']>;
	isConfigVariable: boolean;
}): string {
	for (const keyVariableName in replaceVariableValue) {
		if (keyVariableName !== variableName) {
			continue;
		}
		const replaceBranches = replaceVariableValue[keyVariableName];
		const elsePart = replaceBranches.else;
		const allBranchesWithoutElse = omit(replaceBranches, ['else']);

		for (const keyBranch in allBranchesWithoutElse) {
			let parsedKey = '';
			try {
				parsedKey = JSON.parse(keyBranch) as string;
			} catch (e) {
				window.showErrorMessage(`Invalid JSON key: ${(e as Error).message}`);
				return variableValue;
			}

			if (isConfigVariable) {
				try {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					variableValue = JSON.parse(variableValue);
				} catch (e) {
				}
			}

			if (isEqual(parsedKey, variableValue)) {
				return allBranchesWithoutElse[keyBranch];
			}
		}

		if (elsePart) {
			return elsePart;
		}
	}

	return variableValue;
}

function replaceConfigurationVariable(configName: string, replaceVariableValue: StatusBar['replaceVariableValue'] | undefined): string {
	if (!configName.includes('.')) {
		window.showErrorMessage(`Need a dot (.) in the name of configuration. "${configName}"`);
		return configName;
	}

	const configParts = configName.split('.');
	const configValue = workspace.getConfiguration(configParts[0]).get(configParts.slice(1).join('.'));

	// Replace variable value will use JSON.parse() on all config values for comparison
	if (replaceVariableValue) {
		return JSON.stringify(configValue);
	}

	if (
		Array.isArray(configValue) ||
		(configValue !== null && typeof configValue === 'object')
	) {
		return JSON.stringify(configValue);
	}

	return String(configValue);
}
/**
 * Replace `command:commandId` variable with the result of
 * executing that command.
 */
async function replaceCommandVariable(commandId: string, args: unknown): Promise<string> {
	const commandReturnValue = await commands.executeCommand(commandId, args);

	// Command variables ignore everything except string return value
	// https://code.visualstudio.com/docs/editor/variables-reference#_command-variables
	if (commandReturnValue === undefined || commandReturnValue === null) {
		return extUtils.wrapVariable(VariableNames.CommandVariablePrefix + commandId);
	}

	// This extension returns Array or Object as json stringified strings, though.
	if (
		Array.isArray(commandReturnValue) ||
		(commandReturnValue !== null && typeof commandReturnValue === 'object')
	) {
		return JSON.stringify(commandReturnValue);
	}

	return String(commandReturnValue);
}
async function replaceInputVariable(inputName: string, inputs: Inputs | undefined): Promise<boolean | number | string | undefined> {
	if (!inputs) {
		window.showErrorMessage(`Missing "inputs" property to resolve "${inputName}" variable.`);
		return extUtils.wrapVariable(inputName);
	}

	const foundInput = inputs.find((input => input.id === inputName));
	if (!foundInput) {
		window.showErrorMessage(`Missing input with the "id" of "${inputName}" from the array of "inputs" to resolve the variable.`);
		return extUtils.wrapVariable(inputName);
	}

	if (foundInput.type === 'pickString') {
		const quickPickRawResult = await window.showQuickPick(foundInput.options, {
			title: foundInput.description,
		}) as InputPickStringOption;
		// pickString supports either strings or objects in the form of { label: string, value: string }
		const quickPickResultValue = typeof quickPickRawResult === 'string' ? quickPickRawResult : quickPickRawResult?.value;
		const quickPickResult = defaultStringValue(quickPickResultValue, foundInput.default);
		return quickPickResult;
	} else if (foundInput.type === 'promptString') {
		const inputResult = defaultStringValue(await window.showInputBox({
			title: foundInput.description,
			password: foundInput.password,
		}), foundInput.default);

		if (foundInput?.convertType === 'boolean') {
			return Boolean(inputResult);
		} else if (foundInput?.convertType === 'number') {
			return Number(inputResult);
		}

		return inputResult;
	} else if (foundInput.type === 'command') {
		return replaceCommandVariable(foundInput.command, foundInput.args);
	}

	return extUtils.wrapVariable(VariableNames.InputVariablePrefix + inputName);
}

/**
 * Walk recursively through object/array and replace variables in strings.
 */
export async function substituteVariableRecursive(item: unknown, inputs: Inputs | undefined): Promise<unknown> {
	if (typeof item === 'string') {
		const substituted = await substituteVariables({
			strArg: item,
			inputs,
		});
		return substituted;
	}

	if (Array.isArray(item)) {
		for (const [key, value] of item.entries()) {
			item[key] = await substituteVariableRecursive(value, inputs);
		}
	} else if (typeof item === 'object' && item !== null) {
		for (const key in item) {
			// @ts-expect-error implicit any :(
			item[key] = await substituteVariableRecursive(item[key], inputs);
		}
	}

	return item;
}

function defaultStringValue(value: string | undefined, defaultValue: string | undefined): string | undefined {
	return value === '' || value === undefined ? defaultValue : value;
}
