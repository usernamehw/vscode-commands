import { TextEditor } from 'vscode';

export function escapeCommandUriArgumentCommand(editor: TextEditor) {
	const selectionRange = editor.selection;
	const selectionText = editor.document.getText(selectionRange);
	if (!selectionText) {
		return;
	}
	const escapedArgument = encodeURIComponent(JSON.stringify(selectionText));
	editor.edit(builder => {
		builder.replace(selectionRange, escapedArgument);
	});
}
