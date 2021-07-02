import { commands, window } from 'vscode';
import { showQuickPick } from './quickPick';
import { CommandFolder, CommandObject, Runnable, Sequence } from './types';
import { isSimpleObject, sleep } from './utils';
/**
 * Execute runnable or folder.
 * Executing a folder - is to show Quick Pick to choose one of the commands inside that folder.
 */
export async function run(runnable: CommandFolder & Runnable) {
	if (typeof runnable === 'string') {
		await runObject({
			command: runnable,
		});
		return;
	}
	if (runnable.nestedItems) {
		await runFolder(runnable);
		return;
	}
	if (Array.isArray(runnable)) {
		await runArray(runnable);
	} else if (isSimpleObject(runnable)) {
		if (Array.isArray(runnable.sequence)) {
			await runArray(runnable.sequence);
		} else {
			await runObject(runnable);
		}
		return;
	}
	window.showErrorMessage(`Unknown command type ${JSON.stringify(runnable)}`);
}
async function runArray(arr: Sequence) {
	for (const item of arr) {
		if (typeof item === 'string') {
			await runObject({
				command: item,
			});
		} else {
			await runObject(item);
		}
	}
}

async function runObject(object: CommandObject) {
	if (object.delay) {
		await sleep(object.delay);
	}
	const commandId = object.command;
	if (!commandId) {
		window.showErrorMessage('Missing `command` property.');
	}
	return await commands.executeCommand(commandId, object.args);
}

async function runFolder(folder: CommandFolder) {
	await showQuickPick(folder.nestedItems!);
}
