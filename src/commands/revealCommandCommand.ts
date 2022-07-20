import { window } from 'vscode';
import { applyForTreeItem } from '../commands';
import { RunCommandTreeItem } from '../TreeViewProvider';
import { goToSymbol, openSettingsJSON } from '../utils';

export function revealCommandCommand(treeItem: RunCommandTreeItem) {
	const symbolName = treeItem.getLabelName();
	applyForTreeItem(async ({ configTarget }) => {
		await openSettingsJSON(configTarget);
		goToSymbol(window.activeTextEditor, symbolName);
	}, treeItem);
}

export async function revealCommand2Command({ workspaceId, label }: { workspaceId?: string; label: string }) {
	await openSettingsJSON(workspaceId ? 'workspace' : 'global');
	goToSymbol(window.activeTextEditor, label);
}
