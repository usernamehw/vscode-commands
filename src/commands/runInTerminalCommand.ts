import { Disposable, window } from 'vscode';

interface RunInTerminalArgs {
	text?: string;
	name?: string;
	cwd?: string;
	reveal?: boolean;
	waitForExit?: boolean;
}

let onDidCloseTerminalDisposable: Disposable;

export async function runInTerminalCommand(arg: RunInTerminalArgs | string): Promise<unknown> {
	return new Promise((resolve, reject) => {
		if (typeof arg === 'string') {
			const newTerm = window.createTerminal();
			newTerm.sendText(arg);
			newTerm.show();
		} else {
			if (!arg.text) {
				window.showErrorMessage('No "text" property provided.');
				return;
			}
			const newTerm = window.createTerminal({
				name: arg.name,
				cwd: arg.cwd,
			});
			if (arg.waitForExit) {
				onDidCloseTerminalDisposable = window.onDidCloseTerminal(closedTerminal => {
					if (closedTerminal.name === newTerm.name) {
						resolve(true);
						onDidCloseTerminalDisposable?.dispose();
					}
				});
			} else {
				resolve(false);
			}
			newTerm.sendText(arg.text);
			if (arg.reveal) {
				newTerm.show();
			}
		}
	});
}
