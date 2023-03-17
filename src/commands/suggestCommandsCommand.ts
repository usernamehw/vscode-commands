import { window, type TextEditor } from 'vscode';
import { commandsToQuickPickItems, removeCodiconFromLabel } from '../quickPick';
import { getAllVscodeCommands } from '../utils';

export async function suggestCommandsCommand(editor: TextEditor): Promise<void> {
	const quickPickItems = commandsToQuickPickItems(await getAllVscodeCommands());

	const picked = await window.showQuickPick(quickPickItems);
	if (!picked) {
		return;
	}

	editor.edit(builder => {
		builder.insert(editor.selection.active, removeCodiconFromLabel(picked.label));
	});
}
