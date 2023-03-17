/* eslint-disable no-await-in-loop */
import { commands, window } from 'vscode';
import { $config, $state } from './extension';
import { showQuickPick } from './quickPick';
import { substituteVariableRecursive, substituteVariables } from './substituteVariables';
import { type CommandFolder, type CommandObject, type Runnable, type Sequence } from './types';
import { deepCopy, getAllNestedCommands, isSimpleObject, sleep } from './utils';

/**
 * Execute runnable or folder.
 * Executing a folder - is to show Quick Pick to choose one of the commands inside that folder.
 */
export async function run(runnable: CommandFolder & Runnable): Promise<void> {
	$state.lastExecutedCommand = runnable;
	if (typeof runnable === 'string') {
		const { command, args } = parseSimplifiedArgs(runnable);
		await runObject({
			command,
			args,
		});
		return;
	}
	if (runnable.nestedItems) {
		runFolder(runnable);
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
async function runArray(arr: Sequence): Promise<void> {
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
async function runObject(object: CommandObject): Promise<void> {
	if (object.repeat !== undefined) {
		const repeat = object.repeat;
		if (typeof repeat !== 'number') {
			window.showErrorMessage('"repeat" must be number.');
			return;
		}
		if (repeat <= 0) {
			window.showErrorMessage('"repeat" must be bigger than zero.');
			return;
		}
		// property "repeat" is read-only (can't delete), need copy
		const objectWithoutRepeat = {
			...object,
		};
		delete objectWithoutRepeat?.repeat;

		for (let i = 0; i < repeat; i++) {
			await runObject(objectWithoutRepeat);
		}
	}

	if (object.delay) {
		await sleep(object.delay);
	}
	let commandId = object.command;
	if ($config.alias[commandId]) {
		commandId = $config.alias[commandId];
	}
	if (!commandId) {
		window.showErrorMessage('Missing `command` property.');
	}

	let args = object.args;
	if ($config.variableSubstitutionEnabled) {
		if (typeof args === 'string') {
			args = await substituteVariables(args);
		} else if (
			Array.isArray(args) ||
			(typeof args === 'object' && args !== null)
		) {
			args = await substituteVariableRecursive(deepCopy(args));
		}
	}

	try {
		await commands.executeCommand(commandId, args);
	} catch (err) {
		window.showErrorMessage((err as Error).message);
		throw err;
	}
}
/**
 * Run folder (show Quick pick with all commands inside that folder).
 */
function runFolder(folder: CommandFolder): void {
	showQuickPick(getAllNestedCommands(folder), true);
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

