import { Disposable, window } from 'vscode';
import { createTerminalCommand } from './createTerminalCommand';
import { revealTerminalCommand } from './revealTerminalCommand';

interface RunInTerminalArgs {
	text?: string;
	name?: string;
	iconColor?: string;
	cwd?: string;
	reveal?: boolean;
	waitForExit?: boolean;
	reuse?: string;
}

let onDidCloseTerminalDisposable: Disposable;

export async function runInTerminalCommand(arg: RunInTerminalArgs | string): Promise<unknown> {
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
			}
			const targetTerm = arg.reuse ? revealTerminalCommand({ ...arg, oldest: arg.reuse === "oldest" }, true) : createTerminalCommand(arg, true);
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
	});
}
