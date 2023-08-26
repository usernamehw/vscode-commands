import { window, type TextEditor } from 'vscode';
import { getAllWorkbenchColors } from '../jsonSchema/registerDynamicJsonSchema';

export async function suggestColorsCommand(editor: TextEditor): Promise<void> {
	const quickPickItems = (await getAllWorkbenchColors()).map(color => ({
		label: color[0],
		detail: color[1],
	}));

	const picked = await window.showQuickPick(quickPickItems);
	if (!picked) {
		return;
	}

	editor.edit(builder => {
		builder.insert(editor.selection.active, picked.label);
	});
}
