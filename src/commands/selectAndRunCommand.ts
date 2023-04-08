import { window } from 'vscode';
import { run } from '../run';
import { vscodeUtils } from '../utils/vscodeUtils';

export async function selectAndRunCommand(): Promise<void> {
	const pickedCommand = await window.showQuickPick(await vscodeUtils.getAllVscodeCommands());
	if (!pickedCommand) {
		return;
	}
	await run({
		command: pickedCommand,
	});
}
