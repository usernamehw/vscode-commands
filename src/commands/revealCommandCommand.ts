import { window } from 'vscode';
import { applyForTreeItem } from '../commands';
import { type RunCommandTreeItem } from '../TreeViewProvider';
import { goToSymbol, openSettingsJson } from '../utils';

export function revealCommandCommand(treeItem: RunCommandTreeItem): void {
	const symbolName = treeItem.getLabelName();
	applyForTreeItem(async ({ configTarget }) => {
		await openSettingsJson(configTarget);
		goToSymbol(window.activeTextEditor, symbolName);
	}, treeItem);
}

export async function revealCommand2Command({ workspaceId, label }: { workspaceId?: string; label: string }): Promise<void> {
	await openSettingsJson(workspaceId ? 'workspace' : 'global');
	goToSymbol(window.activeTextEditor, label);
}
