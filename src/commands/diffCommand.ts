import { commands, TabInputText, TextDocumentShowOptions, Uri, window } from 'vscode';
import { CommandId } from '../commands';

interface DiffArgs {
	kind: 'openEditors' | 'visibleEditors';
	title?: string;
	columnOptions?: TextDocumentShowOptions;
}

export async function diffCommand(arg?: DiffArgs) {
	if (arg === undefined) {
		window.showErrorMessage(`${CommandId.Diff}: "args" is required.`);
		return;
	}
	let leftHandResource: Uri;
	let rightHandResource: Uri;

	if (arg.kind === 'visibleEditors') {
		const visibleTextEditors = window.visibleTextEditors;
		if (visibleTextEditors.length < 2) {
			window.showErrorMessage(`${CommandId.Diff}: Need at least 2 visible editors.`);
			return;
		}
		leftHandResource = visibleTextEditors[0].document.uri;
		rightHandResource = visibleTextEditors[1].document.uri;
	} else if (arg.kind === 'openEditors') {
		const activeTabs = window.tabGroups.activeTabGroup.tabs;
		if (activeTabs.length < 2) {
			window.showErrorMessage(`${CommandId.Diff}: Need at least 2 opened tabs in active tab group.`);
			return;
		}
		if (!activeTabs.every(tab => tab.input instanceof TabInputText)) {
			window.showErrorMessage(`${CommandId.Diff}: Tabs need to be text.`);
			return;
		}
		leftHandResource = (activeTabs[0].input as TabInputText).uri;
		rightHandResource = (activeTabs[1].input as TabInputText).uri;
	} else if (arg.kind === 'selection') {
		// TODO: maybe diff selected text https://stackoverflow.com/questions/69333492/vscode-create-a-document-in-memory-with-uri-for-automated-testing
		return;
		// const activeTextEditor = window.activeTextEditor;
		// if (!activeTextEditor) {
		// 	window.showErrorMessage(`${CommandId.Diff}: No active Text Editor.`);
		// 	return;
		// }
		// const selections = activeTextEditor.selections;
		// if (selections.length !== 2) {
		// 	window.showErrorMessage(`${CommandId.Diff}: Need exactly 2 selections`);
		// 	return;
		// }
		// const leftHandUri = Uri.parse(`untitled:${String(Math.random())}`);
		// const rightHandUri = Uri.parse(`untitled:${String(Math.random())}`);
	} else {
		window.showErrorMessage(`${CommandId.Diff}: Unknown "kind": ${arg?.kind}`);
		return;
	}
	await commands.executeCommand('vscode.diff', leftHandResource, rightHandResource, arg.title, arg.columnOptions);
}
