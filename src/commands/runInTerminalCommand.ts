import { Disposable, Terminal, window } from 'vscode';
import { focusTerminalCommand } from './focusTerminalCommand';
import { CodiconName } from '../codiconNames';

interface RunInTerminalArgs {
	text?: string;
	name?: string;
	icon?: CodiconName;
	iconColor?: string;
	cwd?: string;
	reveal?: boolean;
	waitForExit?: boolean;
	reuse?: "newest" | "oldest";
}

let onDidCloseTerminalDisposable: Disposable;

export async function runInTerminalCommand(arg: RunInTerminalArgs | string): Promise<unknown> {
	let targetTerm: Terminal;
	return new Promise((resolve, reject) => {
		if (!arg) {
			window.showErrorMessage('No arg provided.');
			return;
		}
		if (typeof arg === 'string') {
			const newTerm = window.createTerminal();
			newTerm.sendText(arg);
			newTerm.show();
		} else {
			if (!arg.text) {
				window.showErrorMessage('No "text" property provided.');
				return;
			} else {
				targetTerm = focusTerminalCommand({ ...arg, which: arg.reuse ?? 'create new' }, true);
				if (arg.waitForExit) {
					onDidCloseTerminalDisposable = window.onDidCloseTerminal(closedTerminal => {
						if (closedTerminal.name === targetTerm.name) {
							resolve(true);
							onDidCloseTerminalDisposable?.dispose();
						}
					});
				} else {
					resolve(false);
				}
				targetTerm.sendText(arg.text);
				if (arg.reveal) {
					targetTerm.show();
				}
			}
		}
	});
}
