import { window, type TextEditor } from 'vscode';
import { commandsToQuickPickItems } from '../quickPick';
import { vscodeUtils } from '../reexport';

export async function suggestCommandsCommand(editor: TextEditor): Promise<void> {
	const quickPickItems = commandsToQuickPickItems(await vscodeUtils.getAllVscodeCommands());

	const picked = await window.showQuickPick(quickPickItems);
	if (!picked) {
		return;
	}

	editor.edit(builder => {
		builder.insert(editor.selection.active, picked.key);
	});
}
