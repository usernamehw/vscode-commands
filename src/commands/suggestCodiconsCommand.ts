import { QuickPickItem, TextEditor, window } from 'vscode';
import { codiconNames } from '../codiconNames';

export async function suggestCodiconsCommand(editor: TextEditor) {
	const quickPickItems = codiconNames.map(codiconName => ({
		label: codiconName,
		description: `$(${codiconName})`,
	} as QuickPickItem));

	const picked = await window.showQuickPick(quickPickItems);
	if (!picked) {
		return;
	}

	editor.edit(builder => {
		builder.insert(editor.selection.active, picked.label);
	});
}
