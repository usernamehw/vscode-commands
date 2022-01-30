import escapeRegExp from 'lodash/escapeRegExp';
import path from 'path';
import { env, window, workspace } from 'vscode';

const enum VariableNames {
	file = '${file}', // the current opened file (absolute path?)
	fileBasename = '${fileBasename}', // the current opened file's basename
	fileBasenameNoExtension = '${fileBasenameNoExtension}', // the current opened file's basename with no file extension
	fileExtname = '${fileExtname}', // the current opened file's extension
	fileDirname = '${fileDirname}', // the current opened file's dirname
	fileWorkspaceFolder = '${fileWorkspaceFolder}', // the current opened file's workspace folder (no idea)
	workspaceFolder = '${workspaceFolder}', // the path of the folder opened in VS Code
	workspaceFolderBasename = '${workspaceFolderBasename}', // the name of the folder opened in VS Code without any slashes (/)
	execPath = '${execPath}', //  location of Code.exe
	pathSeparator = '${pathSeparator}', // `/` on macOS or linux, `\` on Windows
	lineNumber = '${lineNumber}', // the current selected line number in the active file
	selectedText = '${selectedText}', // the current selected text in the active file
	environmentVariable = '${env}',
	singleEnvironmentVariable = 'env',
	configurationVariable = '${config}',
	singleConfigurationVariable = 'config',
	// ────────────────────────────────────────────────────────────
	// relativeFile = '${relativeFile}', // the current opened file relative to `workspaceFolder`
	// relativeFileDirname = '${relativeFileDirname}', // the current opened file's dirname relative to `workspaceFolder`
	// cwd = '${cwd}', // the task runner's current working directory on startup
}

const variableRegexps = {
	[VariableNames.file]: new RegExp(escapeRegExp(VariableNames.file), 'ig'),
	[VariableNames.fileBasename]: new RegExp(escapeRegExp(VariableNames.fileBasename), 'ig'),
	[VariableNames.fileBasenameNoExtension]: new RegExp(escapeRegExp(VariableNames.fileBasenameNoExtension), 'ig'),
	[VariableNames.fileDirname]: new RegExp(escapeRegExp(VariableNames.fileDirname), 'ig'),
	[VariableNames.fileExtname]: new RegExp(escapeRegExp(VariableNames.fileExtname), 'ig'),
	[VariableNames.fileWorkspaceFolder]: new RegExp(escapeRegExp(VariableNames.fileWorkspaceFolder), 'ig'),
	[VariableNames.workspaceFolder]: new RegExp(escapeRegExp(VariableNames.workspaceFolder), 'ig'),
	[VariableNames.workspaceFolderBasename]: new RegExp(escapeRegExp(VariableNames.workspaceFolderBasename), 'ig'),
	[VariableNames.execPath]: new RegExp(escapeRegExp(VariableNames.execPath), 'ig'),
	[VariableNames.pathSeparator]: new RegExp(escapeRegExp(VariableNames.pathSeparator), 'ig'),
	[VariableNames.lineNumber]: new RegExp(escapeRegExp(VariableNames.lineNumber), 'ig'),
	[VariableNames.selectedText]: new RegExp(escapeRegExp(VariableNames.selectedText), 'ig'),
	[VariableNames.singleEnvironmentVariable]: /\${env:([a-zA-Z_]+[a-zA-Z0-9_]*)}/i,
	[VariableNames.environmentVariable]: /\${env:([a-zA-Z_]+[a-zA-Z0-9_]*)}/ig,
	[VariableNames.singleConfigurationVariable]: /\${config:([^}]+?)}/i,
	[VariableNames.configurationVariable]: /\${config:([^}]+?)}/ig,
	// [VariableNames.relativeFile]: new RegExp(escapeRegExp(VariableNames.relativeFile), 'ig'),
	// [VariableNames.relativeFileDirname]: new RegExp(escapeRegExp(VariableNames.relativeFileDirname), 'ig'),
	// [VariableNames.cwd]: new RegExp(escapeRegExp(VariableNames.cwd), 'ig'),
};
/**
 * Try to emulate variable substitution in tasks https://code.visualstudio.com/docs/editor/variables-reference
 *
 * TODO: throw errors (window.showMessage) when variable exists but can't resolve
 */
export function substituteVariables(str: string) {
	const activeTextEditor = window.activeTextEditor;
	const workspaceFolder = workspace.workspaceFolders?.[0].uri.fsPath;
	if (str.includes(VariableNames.selectedText) && activeTextEditor) {
		const selection = activeTextEditor.selection;
		const selectedText = activeTextEditor.document.getText(selection);
		str = str.replace(variableRegexps[VariableNames.selectedText], selectedText);
	}
	if (str.includes(VariableNames.pathSeparator)) {
		str = str.replace(variableRegexps[VariableNames.pathSeparator], path.sep);
	}
	if (str.includes(VariableNames.lineNumber) && activeTextEditor) {
		str = str.replace(variableRegexps[VariableNames.lineNumber], String(activeTextEditor.selection.active.line + 1));
	}
	if (str.includes(VariableNames.execPath)) {
		str = str.replace(variableRegexps[VariableNames.execPath], env.appRoot);
	}
	if (str.includes(VariableNames.file) && activeTextEditor) {
		str = str.replace(variableRegexps[VariableNames.file], activeTextEditor.document.uri.fsPath);
	}
	if (str.includes(VariableNames.fileBasename) && activeTextEditor) {
		str = str.replace(variableRegexps[VariableNames.fileBasename], path.basename(activeTextEditor.document.uri.fsPath));
	}
	if (str.includes(VariableNames.fileBasenameNoExtension) && activeTextEditor) {
		str = str.replace(variableRegexps[VariableNames.fileBasenameNoExtension], path.basename(activeTextEditor.document.uri.fsPath, path.extname(activeTextEditor.document.uri.fsPath)));
	}
	if (str.includes(VariableNames.fileExtname) && activeTextEditor) {
		str = str.replace(variableRegexps[VariableNames.fileExtname], path.extname(activeTextEditor.document.uri.fsPath));
	}
	if (str.includes(VariableNames.fileDirname) && activeTextEditor) {
		str = str.replace(variableRegexps[VariableNames.fileDirname], path.dirname(activeTextEditor.document.uri.fsPath));
	}
	if (str.includes(VariableNames.workspaceFolder) && workspaceFolder) {
		str = str.replace(variableRegexps[VariableNames.workspaceFolder], workspaceFolder);
	}
	if (str.includes(VariableNames.workspaceFolderBasename) && workspaceFolder) {
		str = str.replace(variableRegexps[VariableNames.workspaceFolderBasename], path.basename(workspaceFolder));
	}
	if (str.includes(VariableNames.fileWorkspaceFolder) && activeTextEditor && workspaceFolder) {
		const fileWorkspaceFolder = workspace.getWorkspaceFolder(activeTextEditor.document.uri)?.uri.fsPath;
		if (fileWorkspaceFolder) {
			str = str.replace(variableRegexps[VariableNames.fileWorkspaceFolder], fileWorkspaceFolder);
		}
	}
	if (variableRegexps[VariableNames.environmentVariable].test(str)) {
		const match = str.match(variableRegexps[VariableNames.environmentVariable]);

		for (const _ of match || []) {
			str = str.replace(variableRegexps[VariableNames.singleEnvironmentVariable], (__, g1) => process.env[g1] || g1);
		}
	}
	if (variableRegexps[VariableNames.configurationVariable].test(str)) {
		const match = str.match(variableRegexps[VariableNames.configurationVariable]);

		for (const _ of match || []) {
			str = str.replace(variableRegexps[VariableNames.singleConfigurationVariable], (__, g1) => replaceConfigurationVariable(g1));
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
	if (typeof configValue !== 'string' && typeof configValue !== 'number') {
		window.showErrorMessage(`Configuration must be of type: string or number "${configName}"`);
		return configName;
	}
	return String(configValue);
}
