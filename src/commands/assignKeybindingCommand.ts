import { RunCommandTreeItem } from '../TreeViewProvider';
import { openKeybindingsGuiAt } from '../utils';

export function assignKeybindingCommand(treeItem: RunCommandTreeItem) {
	openKeybindingsGuiAt(treeItem.getLabelName());
}
