import { QuickPickItem, TextEditor, window } from 'vscode';
import { codiconNames } from '../codiconNames';

export async function suggestCodiconsCommand(editor: TextEditor) {
	type CustomQuickPickItem = QuickPickItem & {value: string};

	const quickPickItems = codiconNames.map(
		codiconName =>
			({
				label: `$(${codiconName}) ${codiconName}`,
				value: codiconName
			} as CustomQuickPickItem),
	);

	const picked = await window.showQuickPick(quickPickItems);
	if (!picked) {
		return;
	}

	editor.edit(builder => {
		builder.insert(editor.selection.active, picked.value);
	});
}
