import { window } from 'vscode';
import { type RunCommandTreeItem } from '../TreeViewProvider';
import { extUtils } from '../utils/extUtils';
import { vscodeUtils } from '../utils/vscodeUtils';

export function revealCommandCommand(treeItem: RunCommandTreeItem): void {
	const symbolName = treeItem.getLabelName();
	extUtils.applyForTreeItem(async ({ configTarget }) => {
		await vscodeUtils.openSettingsJson(configTarget);
		vscodeUtils.goToSymbol(window.activeTextEditor, symbolName);
	}, treeItem);
}

export async function revealCommand2Command({ workspaceId, label }: { workspaceId?: string; label: string }): Promise<void> {
	await vscodeUtils.openSettingsJson(workspaceId ? 'workspace' : 'global');
	vscodeUtils.goToSymbol(window.activeTextEditor, label);
}
