import { window, type QuickPickItem, type TextEditor } from 'vscode';
import { getAllCodiconNames } from '../jsonSchema/registerDynamicJsonSchema';

export async function suggestCodiconsCommand(editor: TextEditor): Promise<void> {
	type CustomQuickPickItem = QuickPickItem & { value: string };

	const quickPickItems: CustomQuickPickItem[] = (await getAllCodiconNames()).map(codiconName => ({
		label: `$(${codiconName}) ${codiconName}`,
		value: codiconName,
	}));

	const picked = await window.showQuickPick(quickPickItems);
	if (!picked) {
		return;
	}

	editor.edit(builder => {
		builder.insert(editor.selection.active, picked.value);
	});
}
