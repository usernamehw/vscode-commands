import { homedir } from 'os';
import path from 'path';
import { env, window, workspace } from 'vscode';
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
export async function substituteVariables(strArg: string): Promise<string> {
	const replacedString = await utils.replaceAsync(strArg, /\$\{[^}]+\}/giu, async match => {
		const variableName = match.slice(2, -1);// Remove `${` and `}` from match
		return replaceSingleVariable(variableName as VariableNames);
	});

	return replacedString;
}

async function replaceSingleVariable(variableName: VariableNames): Promise<string> {
	const activeTextEditor = window.activeTextEditor;
	const workspaceFolderFsPath = workspace.workspaceFolders?.[0].uri.fsPath;

	switch (variableName) {
		case VariableNames.SelectedText: {
			if (!activeTextEditor) {
				break;
			}
			const selectedText = activeTextEditor.document.getText(activeTextEditor.selection);
			return selectedText;
		}
		case VariableNames.LineNumber: {
			if (!activeTextEditor) {
				break;
			}
			return String(activeTextEditor.selection.active.line + 1);
		}
		case VariableNames.SelectedLineCount: {
			if (!activeTextEditor) {
				break;
			}
			const selectedLineCount = vscodeUtils.getSelectedLineNumbers(activeTextEditor).length;
			return selectedLineCount > 1 ? String(selectedLineCount) : '';
		}
		case VariableNames.PathSeparator:
		case VariableNames.PathSeparatorAlias: {
			return path.sep;
		}
		case VariableNames.ExecPath: {
			return env.appRoot;
		}
		case VariableNames.UserHome: {
			return homedir();
		}
		case VariableNames.File: {
			if (!activeTextEditor) {
				break;
			}
			return activeTextEditor.document.uri.fsPath;
		}
		case VariableNames.FileBasename: {
			if (!activeTextEditor) {
				break;
			}
			return path.basename(activeTextEditor.document.uri.fsPath);
		}
		case VariableNames.FileBasenameNoExtension: {
			if (!activeTextEditor) {
				break;
			}
			return path.basename(activeTextEditor.document.uri.fsPath, path.extname(activeTextEditor.document.uri.fsPath));
		}
		case VariableNames.FileExtname: {
			if (!activeTextEditor) {
				break;
			}
			return path.extname(activeTextEditor.document.uri.fsPath);
		}
		case VariableNames.FileDirname: {
			if (!activeTextEditor) {
				break;
			}
			return path.dirname(activeTextEditor.document.uri.fsPath);
		}
		case VariableNames.WorkspaceFolder: {
			if (!workspaceFolderFsPath) {
				break;
			}
			return workspaceFolderFsPath;
		}
		case VariableNames.WorkspaceFolderBasename: {
			if (!workspaceFolderFsPath) {
				break;
			}
			return path.basename(workspaceFolderFsPath);
		}
		case VariableNames.FileWorkspaceFolder: {
			if (!activeTextEditor || !workspaceFolderFsPath) {
				break;
			}
			const fileWorkspaceFolder = workspace.getWorkspaceFolder(activeTextEditor.document.uri)?.uri.fsPath;
			if (fileWorkspaceFolder) {
				return fileWorkspaceFolder;
			}
			break;
		}
		case VariableNames.Random: {
			return String(Math.random()).slice(2, 8);
		}
		case VariableNames.RandomHex: {
			return Math.random().toString(16).slice(2, 8);
		}
		case VariableNames.Clipboard: {
			return env.clipboard.readText();
		}
		case VariableNames.CurrentYear: {
			return String(new Date().getFullYear());
		}
		case VariableNames.CurrentYearShort: {
			return String(new Date().getFullYear()).slice(-2);
		}
		case VariableNames.CurrentMonth: {
			return String(new Date().getMonth().valueOf() + 1).padStart(2, '0');
		}
		case VariableNames.CurrentDate: {
			return String(new Date().getDate().valueOf()).padStart(2, '0');
		}
		case VariableNames.CurrentHour: {
			return String(new Date().getHours().valueOf()).padStart(2, '0');
		}
		case VariableNames.CurrentMinute: {
			return String(new Date().getMinutes().valueOf()).padStart(2, '0');
		}
		case VariableNames.CurrentSecond: {
			return String(new Date().getSeconds().valueOf()).padStart(2, '0');
		}
		case VariableNames.CurrentDayName: {
			return dayNames[new Date().getDay()];
		}
		case VariableNames.CurrentDayNameShort: {
			return dayNamesShort[new Date().getDay()];
		}
		case VariableNames.CurrentMonthName: {
			return monthNames[new Date().getMonth()];
		}
		case VariableNames.CurrentMonthNameShort: {
			return monthNamesShort[new Date().getMonth()];
		}
		case VariableNames.CurrentSecondsUnix: {
			return String(Math.floor(new Date().getTime() / 1000));
		}
		case VariableNames.CurrentTimezoneOffset: {
			const rawTimeOffset = new Date().getTimezoneOffset();
			const sign = rawTimeOffset > 0 ? '-' : '+';
			const hours = Math.trunc(Math.abs(rawTimeOffset / 60));
			const hoursString = (hours < 10 ? `0${hours}` : String(hours));
			const minutes = Math.abs(rawTimeOffset) - (hours * 60);
			const minutesString = (minutes < 10 ? `0${minutes}` : minutes);
			const offset = `${sign + hoursString}:${minutesString}`;
			return offset;
		}
		default: {
			if (variableName.startsWith(VariableNames.EnvironmentVariablePrefix)) {
				const environmentVariableName = variableName.slice(VariableNames.EnvironmentVariablePrefix.length);
				return process.env[environmentVariableName] ?? environmentVariableName;
			}
			if (variableName.startsWith(VariableNames.ConfigurationVariablePrefix)) {
				const configVariableName = variableName.slice(VariableNames.ConfigurationVariablePrefix.length);
				return replaceConfigurationVariable(configVariableName);
			}
			console.error(`Commands: Unknown variable name: "${variableName}".`);
		}
	}

	return `\${${variableName}}`;
}

function replaceConfigurationVariable(configName: string): string {
	if (!configName.includes('.')) {
		window.showErrorMessage(`Need a dot (.) in the name of configuration. "${configName}"`);
		return configName;
	}

	const configParts = configName.split('.');
	const configValue = workspace.getConfiguration(configParts[0]).get(configParts.slice(1).join('.'));

	if (
		Array.isArray(configValue) ||
		(configValue !== null && typeof configValue === 'object')
	) {
		return JSON.stringify(configValue);
	}

	return String(configValue);
}

/**
 * Walk recursively through object/array and replace variables in strings.
 */
export async function substituteVariableRecursive(item: unknown): Promise<unknown> {
	if (typeof item === 'string') {
		const substituted = await substituteVariables(item);
		return substituted;
	}

	if (Array.isArray(item)) {
		for (const [key, value] of item.entries()) {
			item[key] = await substituteVariableRecursive(value);
		}
	} else if (typeof item === 'object' && item !== null) {
		for (const key in item) {
			// @ts-expect-error implicit any :(
			item[key] = await substituteVariableRecursive(item[key]);
		}
	}

	return item;
}
