import { type RunCommandTreeItem } from '../TreeViewProvider';
import { openKeybindingsGuiAt } from '../utils';

export function assignKeybindingCommand(treeItem: RunCommandTreeItem): void {
	openKeybindingsGuiAt(treeItem.getLabelName());
}
