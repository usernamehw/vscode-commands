import { window, type TextEditor } from 'vscode';
import { getAllSettingIds } from '../jsonSchema/registerDynamicJsonSchema';

export async function suggestSettingsCommand(editor: TextEditor): Promise<void> {
	const quickPickItems = (await getAllSettingIds()).map(setting => ({
		label: setting[0],
		detail: setting[1],
	}));

	const picked = await window.showQuickPick(quickPickItems);
	if (!picked) {
		return;
	}

	editor.edit(builder => {
		builder.insert(editor.selection.active, picked.label);
	});
}
