import { Terminal, TerminalOptions, ThemeColor, ThemeIcon, window } from 'vscode';
import { CodiconName } from '../codiconNames';

interface FocusTerminalArgs {
	name?: string;
	icon?: CodiconName;
	iconColor?: string;
	cwd?: string;
	which?: 'create new' | 'newest' | 'oldest';
}

/**
 * Ideally, this would be terminals that are not running tasks?
 */
const nonTaskTerminals: Set<Terminal> = new Set();

export function focusTerminalCommand(arg: FocusTerminalArgs | string, deferShow?: boolean): Terminal {
	const terminals = window.terminals;
	const targetTerminalOptions: TerminalOptions = {};
	let targetTerminal: Terminal | undefined;
	let shouldAttemptReuse = true;
	let shouldMatchNewest = true;

	if (!arg || typeof arg === 'string') {
		targetTerminalOptions.name = arg;
	} else if (arg) {
		shouldAttemptReuse = arg.which !== 'create new';
		shouldMatchNewest = !arg.which || arg.which !== 'oldest';
		targetTerminalOptions.name = arg.name;
		targetTerminalOptions.cwd = arg.cwd;
		targetTerminalOptions.color = arg.iconColor && new ThemeColor(arg.iconColor);
		targetTerminalOptions.iconPath = arg.icon && new ThemeIcon(arg.icon);
	}

	if (shouldAttemptReuse) {
		if (!targetTerminalOptions.name) {
			targetTerminalOptions.name = undefined;
			terminals.forEach(term => term.creationOptions.name === undefined && nonTaskTerminals.add(term));
			nonTaskTerminals.forEach(nonTaskTerm => !terminals.includes(nonTaskTerm) && nonTaskTerminals.delete(nonTaskTerm));
			const termsToQuery = shouldMatchNewest ? [...nonTaskTerminals].reverse() : [...nonTaskTerminals];
			targetTerminal = termsToQuery[0];
		} else {
			const termsToQuery = shouldMatchNewest ? [...terminals].reverse() : terminals;
			targetTerminal = termsToQuery.find(term => term.name === targetTerminalOptions.name);
		}
	}

	targetTerminal ||= window.createTerminal(targetTerminalOptions);

	nonTaskTerminals.add(targetTerminal);

	if (!deferShow) {
		targetTerminal.show();
	}

	return targetTerminal;
}
