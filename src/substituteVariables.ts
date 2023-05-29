/* eslint-disable @typescript-eslint/prefer-regexp-exec, no-await-in-loop */
import escapeRegExp from 'lodash/escapeRegExp';
import { homedir } from 'os';
import path from 'path';
import { env, window, workspace } from 'vscode';
import { vscodeUtils } from './utils/vscodeUtils';

// https://github.com/microsoft/vscode/blob/main/src/vs/workbench/services/configurationResolver/common/variableResolver.ts
// https://github.com/microsoft/vscode/blob/main/src/vs/editor/contrib/snippet/browser/snippetVariables.ts

export const enum VariableNames {
	// ────────────────────────────────────────────────────────────
	// https://code.visualstudio.com/docs/editor/variables-reference
	// ────────────────────────────────────────────────────────────
	UserHome = '${userHome}',
	WorkspaceFolder = '${workspaceFolder}', // the path of the folder opened in VS Code
	WorkspaceFolderBasename = '${workspaceFolderBasename}', // the name of the folder opened in VS Code without any slashes (/)
	File = '${file}', // the current opened file (absolute path?)
	FileWorkspaceFolder = '${fileWorkspaceFolder}', // the current opened file's workspace folder
	// RelativeFile = '${relativeFile}', // the current opened file relative to `workspaceFolder`
	// RelativeFileDirname = '${relativeFileDirname}', // the current opened file's dirname relative to `workspaceFolder`
	FileBasename = '${fileBasename}', // the current opened file's basename
	FileBasenameNoExtension = '${fileBasenameNoExtension}', // the current opened file's basename with no file extension
	FileExtname = '${fileExtname}', // the current opened file's extension
	FileDirname = '${fileDirname}', // the current opened file's dirname
	// FileDirnameBasename = '${fileDirnameBasename}', // the current opened file's folder name
	// cwd = '${cwd}', // the task runner's current working directory on startup
	LineNumber = '${lineNumber}', // the current selected line number in the active file
	SelectedText = '${selectedText}', // the current selected text in the active file
	ExecPath = '${execPath}', //  location of Code.exe
	PathSeparator = '${pathSeparator}', // `/` on macOS or linux, `\` on Windows
	// ────────────────────────────────────────────────────────────
	// https://code.visualstudio.com/docs/editor/userdefinedsnippets#_variables
	// ────────────────────────────────────────────────────────────
	Clipboard = '${clipboard}', // current clipboard value
	Random = '${random}', // 6 random Base-10 digits
	RandomHex = '${randomHex}', // 6 random Base-16 digits
	CurrentYear = '${currentYear}',
	CurrentYearShort = '${currentYearShort}',
	CurrentMonth = '${currentMonth}',
	CurrentMonthName = '${currentMonthName}',
	CurrentMonthNameShort = '${currentMonthNameShort}',
	CurrentDate = '${currentDate}',
	CurrentDayName = '${currentDayName}',
	CurrentDayNameShort = '${currentDayNameShort}',
	CurrentHour = '${currentHour}',
	CurrentMinute = '${currentMinute}',
	CurrentSecond = '${currentSecond}',
	CurrentSecondsUnix = '${currentSecondsUnix}',
	CurrentTimezoneOffset = '${currentTimezoneOffset}',
	// ────────────────────────────────────────────────────────────
	// ──── Additional ────────────────────────────────────────────
	// ────────────────────────────────────────────────────────────
	SelectedLineCount = '${selectedLineCount}', // number of selected lines in the active file
	
	EnvironmentVariable = '${env}',
	SingleEnvironmentVariable = 'env',
	ConfigurationVariable = '${config}',
	SingleConfigurationVariable = 'config',
	// CURRENT_TIMEZONE_OFFSET   `+/-hh:mm` https://github.com/microsoft/vscode/blob/34cba75c513878d683004561c799dd5cd13f5222/src/vs/editor/contrib/snippet/browser/snippetVariables.ts#L296C24-L303
}

const variableRegexps = {
	[VariableNames.UserHome]: new RegExp(escapeRegExp(VariableNames.UserHome), 'igu'),
	[VariableNames.File]: new RegExp(escapeRegExp(VariableNames.File), 'igu'),
	[VariableNames.FileBasename]: new RegExp(escapeRegExp(VariableNames.FileBasename), 'igu'),
	[VariableNames.FileBasenameNoExtension]: new RegExp(escapeRegExp(VariableNames.FileBasenameNoExtension), 'igu'),
	[VariableNames.FileDirname]: new RegExp(escapeRegExp(VariableNames.FileDirname), 'igu'),
	[VariableNames.FileExtname]: new RegExp(escapeRegExp(VariableNames.FileExtname), 'igu'),
	[VariableNames.FileWorkspaceFolder]: new RegExp(escapeRegExp(VariableNames.FileWorkspaceFolder), 'igu'),
	[VariableNames.WorkspaceFolder]: new RegExp(escapeRegExp(VariableNames.WorkspaceFolder), 'igu'),
	[VariableNames.WorkspaceFolderBasename]: new RegExp(escapeRegExp(VariableNames.WorkspaceFolderBasename), 'igu'),
	[VariableNames.ExecPath]: new RegExp(escapeRegExp(VariableNames.ExecPath), 'igu'),
	[VariableNames.PathSeparator]: new RegExp(escapeRegExp(VariableNames.PathSeparator), 'igu'),
	[VariableNames.LineNumber]: new RegExp(escapeRegExp(VariableNames.LineNumber), 'igu'),
	[VariableNames.SelectedText]: new RegExp(escapeRegExp(VariableNames.SelectedText), 'igu'),
	[VariableNames.SelectedLineCount]: new RegExp(escapeRegExp(VariableNames.SelectedLineCount), 'igu'),
	[VariableNames.Clipboard]: new RegExp(escapeRegExp(VariableNames.Clipboard), 'igu'),
	[VariableNames.Random]: new RegExp(escapeRegExp(VariableNames.Random), 'igu'),
	[VariableNames.RandomHex]: new RegExp(escapeRegExp(VariableNames.RandomHex), 'igu'),
	[VariableNames.SingleEnvironmentVariable]: /\$\{env:(?<envVariableName>[a-zA-Z_]+[a-zA-Z0-9_]*)\}/iu,
	[VariableNames.EnvironmentVariable]: /\$\{env:(?:[a-zA-Z_]+[a-zA-Z0-9_]*)\}/igu,
	[VariableNames.SingleConfigurationVariable]: /\$\{config:(?<configName>[^}]+?)\}/iu,
	[VariableNames.ConfigurationVariable]: /\$\{config:(?:[^}]+?)\}/igu,
	[VariableNames.CurrentYear]: new RegExp(escapeRegExp(VariableNames.CurrentYear), 'igu'),
	[VariableNames.CurrentYearShort]: new RegExp(escapeRegExp(VariableNames.CurrentYearShort), 'igu'),
	[VariableNames.CurrentMonth]: new RegExp(escapeRegExp(VariableNames.CurrentMonth), 'igu'),
	[VariableNames.CurrentMonthName]: new RegExp(escapeRegExp(VariableNames.CurrentMonthName), 'igu'),
	[VariableNames.CurrentMonthNameShort]: new RegExp(escapeRegExp(VariableNames.CurrentMonthNameShort), 'igu'),
	[VariableNames.CurrentDate]: new RegExp(escapeRegExp(VariableNames.CurrentDate), 'igu'),
	[VariableNames.CurrentDayName]: new RegExp(escapeRegExp(VariableNames.CurrentDayName), 'igu'),
	[VariableNames.CurrentDayNameShort]: new RegExp(escapeRegExp(VariableNames.CurrentDayNameShort), 'igu'),
	[VariableNames.CurrentHour]: new RegExp(escapeRegExp(VariableNames.CurrentHour), 'igu'),
	[VariableNames.CurrentMinute]: new RegExp(escapeRegExp(VariableNames.CurrentMinute), 'igu'),
	[VariableNames.CurrentSecond]: new RegExp(escapeRegExp(VariableNames.CurrentSecond), 'igu'),
	[VariableNames.CurrentSecondsUnix]: new RegExp(escapeRegExp(VariableNames.CurrentSecondsUnix), 'igu'),
	[VariableNames.CurrentTimezoneOffset]: new RegExp(escapeRegExp(VariableNames.CurrentTimezoneOffset), 'igu'),
	// [VariableNames.relativeFile]: new RegExp(escapeRegExp(VariableNames.relativeFile), 'ig'),
	// [VariableNames.relativeFileDirname]: new RegExp(escapeRegExp(VariableNames.relativeFileDirname), 'ig'),
	// [VariableNames.cwd]: new RegExp(escapeRegExp(VariableNames.cwd), 'ig'),
} satisfies Record<VariableNames, RegExp>;

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
	if (!/\$\{[^}]+\}/u.test(strArg)) {
		return strArg;
	}

	let str = strArg;
	const activeTextEditor = window.activeTextEditor;
	const workspaceFolder = workspace.workspaceFolders?.[0].uri.fsPath;
	if (str.includes(VariableNames.SelectedText) && activeTextEditor) {
		const selection = activeTextEditor.selection;
		const selectedText = activeTextEditor.document.getText(selection);
		str = str.replace(variableRegexps[VariableNames.SelectedText], selectedText);
	}
	if (str.includes(VariableNames.SelectedLineCount) && activeTextEditor) {
		const selectedLineCount = vscodeUtils.getSelectedLineNumbers(activeTextEditor).length;
		str = str.replace(variableRegexps[VariableNames.SelectedLineCount], selectedLineCount > 1 ? String(selectedLineCount) : '');
	}
	if (str.includes(VariableNames.PathSeparator)) {
		str = str.replace(variableRegexps[VariableNames.PathSeparator], path.sep);
	}
	if (str.includes(VariableNames.LineNumber) && activeTextEditor) {
		str = str.replace(variableRegexps[VariableNames.LineNumber], String(activeTextEditor.selection.active.line + 1));
	}
	if (str.includes(VariableNames.ExecPath)) {
		str = str.replace(variableRegexps[VariableNames.ExecPath], env.appRoot);
	}
	if (str.includes(VariableNames.UserHome)) {
		str = str.replace(variableRegexps[VariableNames.UserHome], homedir());
	}
	if (str.includes(VariableNames.File) && activeTextEditor) {
		str = str.replace(variableRegexps[VariableNames.File], activeTextEditor.document.uri.fsPath);
	}
	if (str.includes(VariableNames.FileBasename) && activeTextEditor) {
		str = str.replace(variableRegexps[VariableNames.FileBasename], path.basename(activeTextEditor.document.uri.fsPath));
	}
	if (str.includes(VariableNames.FileBasenameNoExtension) && activeTextEditor) {
		str = str.replace(variableRegexps[VariableNames.FileBasenameNoExtension], path.basename(activeTextEditor.document.uri.fsPath, path.extname(activeTextEditor.document.uri.fsPath)));
	}
	if (str.includes(VariableNames.FileExtname) && activeTextEditor) {
		str = str.replace(variableRegexps[VariableNames.FileExtname], path.extname(activeTextEditor.document.uri.fsPath));
	}
	if (str.includes(VariableNames.FileDirname) && activeTextEditor) {
		str = str.replace(variableRegexps[VariableNames.FileDirname], path.dirname(activeTextEditor.document.uri.fsPath));
	}
	if (str.includes(VariableNames.WorkspaceFolder) && workspaceFolder) {
		str = str.replace(variableRegexps[VariableNames.WorkspaceFolder], workspaceFolder);
	}
	if (str.includes(VariableNames.WorkspaceFolderBasename) && workspaceFolder) {
		str = str.replace(variableRegexps[VariableNames.WorkspaceFolderBasename], path.basename(workspaceFolder));
	}
	if (str.includes(VariableNames.FileWorkspaceFolder) && activeTextEditor && workspaceFolder) {
		const fileWorkspaceFolder = workspace.getWorkspaceFolder(activeTextEditor.document.uri)?.uri.fsPath;
		if (fileWorkspaceFolder) {
			str = str.replace(variableRegexps[VariableNames.FileWorkspaceFolder], fileWorkspaceFolder);
		}
	}
	if (str.includes(VariableNames.Random)) {
		str = str.replace(variableRegexps[VariableNames.Random], String(Math.random()).slice(2, 8));
	}
	if (str.includes(VariableNames.RandomHex)) {
		str = str.replace(variableRegexps[VariableNames.RandomHex], Math.random().toString(16).slice(2, 8));
	}
	if (str.includes(VariableNames.Clipboard)) {
		str = str.replace(variableRegexps[VariableNames.Clipboard], await env.clipboard.readText());
	}
	if (variableRegexps[VariableNames.EnvironmentVariable].test(str)) {
		const match = str.match(variableRegexps[VariableNames.EnvironmentVariable]);

		for (const _ of match ?? []) {
			str = str.replace(variableRegexps[VariableNames.SingleEnvironmentVariable], (__, g1: string) => process.env[g1] ?? g1);
		}
	}
	if (variableRegexps[VariableNames.ConfigurationVariable].test(str)) {
		const match = str.match(variableRegexps[VariableNames.ConfigurationVariable]);

		for (const _ of match ?? []) {
			str = str.replace(variableRegexps[VariableNames.SingleConfigurationVariable], (__, g1: string) => replaceConfigurationVariable(g1));
		}
	}

	if (str.includes(VariableNames.CurrentYear)) {
		str = str.replace(variableRegexps[VariableNames.CurrentYear], String(new Date().getFullYear()));
	}
	if (str.includes(VariableNames.CurrentYearShort)) {
		str = str.replace(variableRegexps[VariableNames.CurrentYearShort], String(new Date().getFullYear()).slice(-2));
	}
	if (str.includes(VariableNames.CurrentMonth)) {
		str = str.replace(variableRegexps[VariableNames.CurrentMonth], String(new Date().getMonth().valueOf() + 1).padStart(2, '0'));
	}
	if (str.includes(VariableNames.CurrentDate)) {
		str = str.replace(variableRegexps[VariableNames.CurrentDate], String(new Date().getDate().valueOf()).padStart(2, '0'));
	}
	if (str.includes(VariableNames.CurrentHour)) {
		str = str.replace(variableRegexps[VariableNames.CurrentHour], String(new Date().getHours().valueOf()).padStart(2, '0'));
	}
	if (str.includes(VariableNames.CurrentMinute)) {
		str = str.replace(variableRegexps[VariableNames.CurrentMinute], String(new Date().getMinutes().valueOf()).padStart(2, '0'));
	}
	if (str.includes(VariableNames.CurrentSecond)) {
		str = str.replace(variableRegexps[VariableNames.CurrentSecond], String(new Date().getSeconds().valueOf()).padStart(2, '0'));
	}
	if (str.includes(VariableNames.CurrentDayName)) {
		str = str.replace(variableRegexps[VariableNames.CurrentDayName], dayNames[new Date().getDay()]);
	}
	if (str.includes(VariableNames.CurrentDayNameShort)) {
		str = str.replace(variableRegexps[VariableNames.CurrentDayNameShort], dayNamesShort[new Date().getDay()]);
	}
	if (str.includes(VariableNames.CurrentMonthName)) {
		str = str.replace(variableRegexps[VariableNames.CurrentMonthName], monthNames[new Date().getMonth()]);
	}
	if (str.includes(VariableNames.CurrentMonthNameShort)) {
		str = str.replace(variableRegexps[VariableNames.CurrentMonthNameShort], monthNamesShort[new Date().getMonth()]);
	}
	if (str.includes(VariableNames.CurrentSecondsUnix)) {
		str = str.replace(variableRegexps[VariableNames.CurrentSecondsUnix], String(Math.floor(new Date().getTime() / 1000)));
	}
	if (str.includes(VariableNames.CurrentTimezoneOffset)) {
		const rawTimeOffset = new Date().getTimezoneOffset();
		const sign = rawTimeOffset > 0 ? '-' : '+';
		const hours = Math.trunc(Math.abs(rawTimeOffset / 60));
		const hoursString = (hours < 10 ? `0${hours}` : String(hours));
		const minutes = Math.abs(rawTimeOffset) - (hours * 60);
		const minutesString = (minutes < 10 ? `0${minutes}` : minutes);
		const offset = `${sign + hoursString}:${minutesString}`;
		str = str.replace(variableRegexps[VariableNames.CurrentTimezoneOffset], offset);
	}

	return str;
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
