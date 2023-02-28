import { commands, Disposable, TerminalOptions, ThemeColor, window } from 'vscode';

interface FocusTerminalArgs {
	name?: string;
	iconColor?: string;
	cwd?: string;
}

let renameTermDisposable: Disposable;

export function createTerminalCommand(arg: FocusTerminalArgs | string, deferReveal: boolean) {
	const targetOpts: TerminalOptions = {};
	if (typeof arg === 'string') {
		targetOpts.name = arg;
	} else if (arg) {
		targetOpts.name = arg.name;
		targetOpts.cwd = arg.cwd;
		targetOpts.color = arg.iconColor && new ThemeColor(arg.iconColor);
	}
	if (!targetOpts.name) {
		targetOpts.name = undefined;
	}
	if (targetOpts.name) {
		renameTermDisposable = window.onDidOpenTerminal((openedTerminal) => {
			commands.executeCommand('workbench.action.terminal.renameWithArg', { name: targetOpts.name });
			renameTermDisposable?.dispose();
		});
	}
	const newTerm = window.createTerminal({ ...targetOpts, name: undefined });
	if (!deferReveal) {
		newTerm.show();
	}
	return newTerm;
}
