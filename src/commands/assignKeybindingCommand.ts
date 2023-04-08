import { type RunCommandTreeItem } from '../TreeViewProvider';
import { vscodeUtils } from '../utils/vscodeUtils';

export function assignKeybindingCommand(treeItem: RunCommandTreeItem): void {
	vscodeUtils.openKeybindingsGuiAt(treeItem.getLabelName());
}
