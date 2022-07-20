import { $state, allCommands } from '../extension';
import { showQuickPick } from '../quickPick';
import { getWorkspaceId } from '../workspaceCommands';

export function openAsQuickPickCommand() {
	showQuickPick(allCommands(getWorkspaceId($state.extensionContext)));
}
