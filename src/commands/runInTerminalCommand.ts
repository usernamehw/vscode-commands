import { Disposable, ThemeColor, window } from 'vscode';

interface RunInTerminalArgs {
	text?: string;
	name?: string;
	iconColor?: string;
	cwd?: string;
	reveal?: boolean;
	waitForExit?: boolean;
	reuse?: boolean;
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
			const targetTerm = (arg.name && arg.reuse)
				&& window.terminals.filter((term) => term.name === arg.name)[0]
				|| window.createTerminal({
					name: arg.name,
					cwd: arg.cwd,
					color: arg.iconColor && new ThemeColor(arg.iconColor)
				});
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
