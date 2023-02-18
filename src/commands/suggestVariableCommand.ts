import { TextEditor, window } from 'vscode';
import { VariableNames } from '../substituteVariables';

export async function suggestVariableCommand(editor: TextEditor) {
	const variables: [string, string][] = [
		[VariableNames.File, 'Current opened file (absolute path?)'],
		[VariableNames.FileBasename, 'Current opened file\'s basename'],
		[VariableNames.FileBasenameNoExtension, 'current opened file\'s basename with no file extension'],
		[VariableNames.FileExtname, 'current opened file\'s extension'],
		[VariableNames.FileDirname, 'the current opened file\'s dirname'],
		[VariableNames.FileWorkspaceFolder, 'the current opened file\'s workspace folder'],
		[VariableNames.WorkspaceFolder, 'the path of the folder opened in VS Code'],
		[VariableNames.WorkspaceFolderBasename, 'the name of the folder opened in VS Code without any slashes (/)'],
		[VariableNames.ExecPath, 'location of Code.exe'],
		[VariableNames.PathSeparator, '`/` on macOS or linux, `\\` on Windows'],
		[VariableNames.LineNumber, 'Current selected line number in the active file'],
		[VariableNames.SelectedText, 'Current selected text in the active file'],
		[VariableNames.Clipboard, 'Current clipboard value'],
		[VariableNames.Random, '6 random Base-10 digits'],
		['${env:}', 'Environment variable value'],
		['${config:}', 'VSCode Configuration value'],
	];
	const picked = await window.showQuickPick(variables.map(variable => ({
		label: variable[0],
		detail: variable[1],
	})), {
		matchOnDetail: true,
	});
	if (!picked) {
		return;
	}
	editor.edit(builder => {
		builder.insert(editor.selection.active, picked.label);
	});
}
