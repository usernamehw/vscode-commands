import { tasks, Terminal, window } from 'vscode';
import { createTerminalCommand } from './createTerminalCommand';

interface FocusTerminalArgs {
	name?: string;
	iconColor?: string;
	cwd?: string;
	oldest?: boolean;
}

export function revealTerminalCommand(arg: FocusTerminalArgs | string, deferReveal: boolean) {
	let targetTerm: Terminal | undefined;
	let terms = window.terminals;
	let targetName: string | undefined;
	if (!arg || typeof arg === 'string') {
		targetName = arg;
		terms = [...terms].reverse();
	} else if (arg) {
		targetName = arg.name;
		if (!arg.oldest) {
			terms = [...terms].reverse();
		}
	}
	if (!targetName) {
		targetName = undefined;
		targetTerm = terms.find((term) => term.creationOptions.name === targetName);
	} else {
		targetTerm = terms.find((term) => term.name === targetName);
	}
	targetTerm ||= createTerminalCommand(arg, true);
	if (!deferReveal) {
		targetTerm.show();
	}
	return targetTerm;
}
