import { commands, window } from 'vscode';
import { extensionConfig } from './extension';
import { showQuickPick } from './quickPick';
import { CommandFolder, CommandObject, Runnable, Sequence } from './types';
import { isSimpleObject, sleep } from './utils';
/**
 * Execute runnable or folder.
 * Executing a folder - is to show Quick Pick to choose one of the commands inside that folder.
 */
export async function run(runnable: CommandFolder & Runnable) {
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
	throw Error('Unknown Command type');
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
	let commandId = object.command;
	if (extensionConfig.alias[commandId]) {
		commandId = extensionConfig.alias[commandId];
	}
	if (!commandId) {
		window.showErrorMessage('Missing `command` property.');
	}
	return await commands.executeCommand(commandId, object.args);
}

async function runFolder(folder: CommandFolder) {
	await showQuickPick(folder.nestedItems!);
}
