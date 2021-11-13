import { commands, window } from 'vscode';
import { extensionConfig, extensionState } from './extension';
import { showQuickPick } from './quickPick';
import { substituteVariables } from './substituteVariables';
import { CommandFolder, CommandObject, Runnable, Sequence } from './types';
import { isSimpleObject, sleep } from './utils';
/**
 * Execute runnable or folder.
 * Executing a folder - is to show Quick Pick to choose one of the commands inside that folder.
 */
export async function run(runnable: CommandFolder & Runnable) {
	extensionState.lastExecutedCommand = runnable;
	if (typeof runnable === 'string') {
		const { command, args } = parseSimplifiedArgs(runnable);
		await runObject({
			command,
			args,
		});
		return;
	}
	if (runnable.nestedItems) {
		await runFolder(runnable);
		return;
	}
	if (Array.isArray(runnable)) {
		await runArray(runnable);
		return;
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
/**
 * `runObject()` must be used in all other `run...` functions because
 * it applies `commands.alias` when needed.
 */
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

	let args = object.args;
	if (extensionConfig.variableSubstitutionEnabled) {
		if (typeof args === 'string') {
			args = substituteVariables(args);
		} else if (
			Array.isArray(args) ||
			typeof args === 'object' && args !== null
		) {
			args = substituteVariables(JSON.stringify(args));
			args = JSON.parse(args as string);
		}
	}

	return await commands.executeCommand(commandId, args);
}

async function runFolder(folder: CommandFolder) {
	await showQuickPick(folder.nestedItems!);
}
/**
 * Allow running a string with args: `commands.runInTerminal?npm run watch` (for runnables that are strings)
 */
function parseSimplifiedArgs(stringArgs: string): {	command: string; args?: unknown } {
	const firstQuestionIndex = stringArgs.indexOf('?');
	if (firstQuestionIndex === -1) {
		return {
			command: stringArgs,
		};
	} else {
		return {
			command: stringArgs.slice(0, firstQuestionIndex),
			args: stringArgs.slice(firstQuestionIndex + 1),
		};
	}
}

