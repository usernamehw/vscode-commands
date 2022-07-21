import { allCommands } from '../extension';
import { showQuickPick } from '../quickPick';

export function openAsQuickPickCommand() {
	showQuickPick(allCommands());
}
