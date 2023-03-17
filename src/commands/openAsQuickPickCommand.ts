import { getAllCommands } from '../extension';
import { showQuickPick } from '../quickPick';

export function openAsQuickPickCommand(): void {
	showQuickPick(getAllCommands());
}
