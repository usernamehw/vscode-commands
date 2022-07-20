import { window } from 'vscode';
import { run } from '../run';
import { getAllVscodeCommands } from '../utils';

export async function selectAndRunCommand() {
	const pickedCommand = await window.showQuickPick(await getAllVscodeCommands());
	if (!pickedCommand) {
		return;
	}
	await run({
		command: pickedCommand,
	});
}
