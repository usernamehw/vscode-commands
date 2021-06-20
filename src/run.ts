import { commands, window } from 'vscode';
import { extensionConfig } from './extension';
import { CommandObject, Runnable, Sequence } from './types';
import { isSimpleObject, sleep } from './utils';

export async function run(runnable: Runnable) {
	if (Array.isArray(runnable)) {
		await runArray(runnable);
	} else if (isSimpleObject(runnable)) {
		if (Array.isArray(runnable.sequence)) {
			await runArray(runnable.sequence);
		} else {
			await runObject(runnable);
		}
		return undefined;
	}
	throw Error('Unknown Command type');
}
async function runArray(arr: Sequence) {
	for (const item of arr) {
		if (typeof item === 'string') {
			await runString(item);
		} else {
			await runObject(item);
		}
	}
}
async function runString(str: string) {
	return await commands.executeCommand(str);
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
