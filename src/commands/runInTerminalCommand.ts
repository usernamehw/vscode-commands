import { window, type Disposable } from 'vscode';
import { CommandId } from '../commands';
import { focusTerminalCommand, type FocusTerminalArgs } from './focusTerminalCommand';

interface RunInTerminalArgs {
	text?: string;
	name?: string;
	icon?: string;
	iconColor?: string;
	cwd?: string;
	reveal?: boolean;
	waitForExit?: boolean;
	reuse?: Exclude<FocusTerminalArgs['target'], 'create new'>;
}

export async function runInTerminalCommand(arg: RunInTerminalArgs | string): Promise<void> {
	let onDidCloseTerminalDisposable: Disposable;

	return new Promise((resolve, reject) => {
		if (arg === undefined) {
			window.showErrorMessage(`No "args" property provided for "${CommandId.RunInTerminal}" command.`);
			return;
		}

		if (typeof arg === 'string') {
			const newTerm = window.createTerminal();
			newTerm.sendText(arg);
			newTerm.show();
		} else if (arg.text) {
			const targetTerminal = focusTerminalCommand({
				...arg,
				target: arg.reuse ?? 'create new',
			}, true);

			if (arg.waitForExit) {
				onDidCloseTerminalDisposable = window.onDidCloseTerminal(closedTerminal => {
					if (closedTerminal.name === targetTerminal.name) {
						resolve();
						onDidCloseTerminalDisposable?.dispose();
					}
				});
			} else {
				resolve();
			}

			targetTerminal.sendText(arg.text);

			if (arg.reveal) {
				targetTerminal.show();
			}
		} else {
			window.showErrorMessage(`No "text" property provided in "args" of "${CommandId.RunInTerminal}" command.`);
		}
	});
}
