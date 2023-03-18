import { window } from 'vscode';
import { vscodeUtils } from '../reexport';
import { run } from '../run';

export async function selectAndRunCommand(): Promise<void> {
	const pickedCommand = await window.showQuickPick(await vscodeUtils.getAllVscodeCommands());
	if (!pickedCommand) {
		return;
	}
	await run({
		command: pickedCommand,
	});
}
