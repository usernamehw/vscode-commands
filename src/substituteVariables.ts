import escapeRegExp from 'lodash/escapeRegExp';
import path from 'path';
import { env, window, workspace } from 'vscode';

// https://github.com/microsoft/vscode/blob/main/src/vs/workbench/services/configurationResolver/common/variableResolver.ts

// TODO: ${userHome}
export const enum VariableNames {
	File = '${file}', // the current opened file (absolute path?)
	FileBasename = '${fileBasename}', // the current opened file's basename
	FileBasenameNoExtension = '${fileBasenameNoExtension}', // the current opened file's basename with no file extension
	FileExtname = '${fileExtname}', // the current opened file's extension
	FileDirname = '${fileDirname}', // the current opened file's dirname
	FileWorkspaceFolder = '${fileWorkspaceFolder}', // the current opened file's workspace folder
	WorkspaceFolder = '${workspaceFolder}', // the path of the folder opened in VS Code
	WorkspaceFolderBasename = '${workspaceFolderBasename}', // the name of the folder opened in VS Code without any slashes (/)
	ExecPath = '${execPath}', //  location of Code.exe
	PathSeparator = '${pathSeparator}', // `/` on macOS or linux, `\` on Windows
	LineNumber = '${lineNumber}', // the current selected line number in the active file
	SelectedText = '${selectedText}', // the current selected text in the active file
	Clipboard = '${clipboard}', // current clipboard value
	EnvironmentVariable = '${env}',
	SingleEnvironmentVariable = 'env',
	ConfigurationVariable = '${config}',
	Random = '${random}',
	SingleConfigurationVariable = 'config',
	// ────────────────────────────────────────────────────────────
	// relativeFile = '${relativeFile}', // the current opened file relative to `workspaceFolder`
	// relativeFileDirname = '${relativeFileDirname}', // the current opened file's dirname relative to `workspaceFolder`
	// cwd = '${cwd}', // the task runner's current working directory on startup
}

const variableRegexps = {
	[VariableNames.File]: new RegExp(escapeRegExp(VariableNames.File), 'ig'),
	[VariableNames.FileBasename]: new RegExp(escapeRegExp(VariableNames.FileBasename), 'ig'),
	[VariableNames.FileBasenameNoExtension]: new RegExp(escapeRegExp(VariableNames.FileBasenameNoExtension), 'ig'),
	[VariableNames.FileDirname]: new RegExp(escapeRegExp(VariableNames.FileDirname), 'ig'),
	[VariableNames.FileExtname]: new RegExp(escapeRegExp(VariableNames.FileExtname), 'ig'),
	[VariableNames.FileWorkspaceFolder]: new RegExp(escapeRegExp(VariableNames.FileWorkspaceFolder), 'ig'),
	[VariableNames.WorkspaceFolder]: new RegExp(escapeRegExp(VariableNames.WorkspaceFolder), 'ig'),
	[VariableNames.WorkspaceFolderBasename]: new RegExp(escapeRegExp(VariableNames.WorkspaceFolderBasename), 'ig'),
	[VariableNames.ExecPath]: new RegExp(escapeRegExp(VariableNames.ExecPath), 'ig'),
	[VariableNames.PathSeparator]: new RegExp(escapeRegExp(VariableNames.PathSeparator), 'ig'),
	[VariableNames.LineNumber]: new RegExp(escapeRegExp(VariableNames.LineNumber), 'ig'),
	[VariableNames.SelectedText]: new RegExp(escapeRegExp(VariableNames.SelectedText), 'ig'),
	[VariableNames.Clipboard]: new RegExp(escapeRegExp(VariableNames.Clipboard), 'ig'),
	[VariableNames.Random]: new RegExp(escapeRegExp(VariableNames.Random), 'ig'),
	[VariableNames.SingleEnvironmentVariable]: /\${env:([a-zA-Z_]+[a-zA-Z0-9_]*)}/i,
	[VariableNames.EnvironmentVariable]: /\${env:([a-zA-Z_]+[a-zA-Z0-9_]*)}/ig,
	[VariableNames.SingleConfigurationVariable]: /\${config:([^}]+?)}/i,
	[VariableNames.ConfigurationVariable]: /\${config:([^}]+?)}/ig,
	// [VariableNames.relativeFile]: new RegExp(escapeRegExp(VariableNames.relativeFile), 'ig'),
	// [VariableNames.relativeFileDirname]: new RegExp(escapeRegExp(VariableNames.relativeFileDirname), 'ig'),
	// [VariableNames.cwd]: new RegExp(escapeRegExp(VariableNames.cwd), 'ig'),
} satisfies Record<VariableNames, RegExp>;
/**
 * Try to emulate variable substitution in tasks https://code.visualstudio.com/docs/editor/variables-reference
 *
 * TODO: throw errors (window.showMessage) when variable exists but can't resolve
 */
export async function substituteVariables(str: string): Promise<string> {
	const activeTextEditor = window.activeTextEditor;
	const workspaceFolder = workspace.workspaceFolders?.[0].uri.fsPath;
	if (str.includes(VariableNames.SelectedText) && activeTextEditor) {
		const selection = activeTextEditor.selection;
		const selectedText = activeTextEditor.document.getText(selection);
		str = str.replace(variableRegexps[VariableNames.SelectedText], selectedText);
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
	if (str.includes(VariableNames.Clipboard)) {
		str = str.replace(variableRegexps[VariableNames.Clipboard], await env.clipboard.readText());
	}
	if (variableRegexps[VariableNames.EnvironmentVariable].test(str)) {
		const match = str.match(variableRegexps[VariableNames.EnvironmentVariable]);

		for (const _ of match || []) {
			str = str.replace(variableRegexps[VariableNames.SingleEnvironmentVariable], (__, g1) => process.env[g1] || g1);
		}
	}
	if (variableRegexps[VariableNames.ConfigurationVariable].test(str)) {
		const match = str.match(variableRegexps[VariableNames.ConfigurationVariable]);

		for (const _ of match || []) {
			str = str.replace(variableRegexps[VariableNames.SingleConfigurationVariable], (__, g1) => replaceConfigurationVariable(g1));
		}
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
export async function substituteVariableRecursive(arg: unknown[] | object | string | unknown): Promise<object | string | unknown> {
	if (typeof arg === 'string') {
		return await substituteVariables(arg);
	}

	if (Array.isArray(arg)) {
		for (const [key, value] of arg.entries()) {
			arg[key] = await substituteVariableRecursive(value);
		}
	} else if (typeof arg === 'object' && arg !== null) {
		for (const key in arg) {
			// @ts-ignore
			arg[key] = await substituteVariableRecursive(arg[key]);
		}
	}

	return arg;
}
