import { window, type TextEditor } from 'vscode';
import { VariableNames } from '../substituteVariables';

export async function suggestVariablesCommand(editor: TextEditor): Promise<void> {
	const variables: [VariableNames, string][] = [
		[VariableNames.UserHome, 'The path of the user\'s home folder'],
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
		[VariableNames.SelectedLineCount, 'Number of selected lines in the active file'],
		[VariableNames.Clipboard, 'Current clipboard value'],
		[VariableNames.Random, '6 random Base-10 digits'],
		[VariableNames.RandomHex, '6 random Base-16 digits'],
		[VariableNames.CurrentYear, 'The current year'],
		[VariableNames.CurrentYearShort, 'The current year\'s last two digits'],
		[VariableNames.CurrentMonth, 'The month as two digits (example \'02\')'],
		[VariableNames.CurrentMonthName, 'The full name of the month (example \'July\')'],
		[VariableNames.CurrentMonthNameShort, 'The short name of the month (example \'Jul\')'],
		[VariableNames.CurrentDate, 'The day of the month as two digits (example \'08\')'],
		[VariableNames.CurrentDayName, 'The name of day (example \'Monday\')'],
		[VariableNames.CurrentDayNameShort, 'The short name of the day (example \'Mon\')'],
		[VariableNames.CurrentHour, 'The current hour in 24-hour clock format'],
		[VariableNames.CurrentMinute, 'The current minute as two digits'],
		[VariableNames.CurrentSecond, 'The current second as two digits'],
		[VariableNames.CurrentSecondsUnix, 'The number of seconds since the Unix epoch'],
		[VariableNames.CurrentTimezoneOffset, 'Current timezone offset'],

		[VariableNames.EnvironmentVariablePrefix, 'Environment variable value'],
		[VariableNames.ConfigurationVariablePrefix, 'VSCode Configuration value'],
	];

	const picked = await window.showQuickPick(variables.map(variable => ({
		label: `\${${variable[0]}}`,
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
