import { window } from 'vscode';

export function runInTerminalCommand(arg: string | { text?: string; name?: string; cwd?: string; reveal?: boolean }) {
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
		newTerm.sendText(arg.text);
		if (arg.reveal) {
			newTerm.show();
		}
	}
}
