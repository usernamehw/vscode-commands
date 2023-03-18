import { vscodeUtils } from '../reexport';
import { type RunCommandTreeItem } from '../TreeViewProvider';

export function assignKeybindingCommand(treeItem: RunCommandTreeItem): void {
	vscodeUtils.openKeybindingsGuiAt(treeItem.getLabelName());
}
