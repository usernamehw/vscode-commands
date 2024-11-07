import { ThemeColor, ThemeIcon, window, type Terminal, type TerminalOptions } from 'vscode';

export interface FocusTerminalArgs {
	name?: string;
	icon?: string;
	iconColor?: string;
	cwd?: string;
	target?: 'create new' | 'newest' | 'oldest';
}

/**
 * Ideally, this would be terminals that are not running tasks?
 */
const nonTaskTerminals = new Set<Terminal>();

export function focusTerminalCommand(arg: FocusTerminalArgs | string, deferShow?: boolean): Terminal {
	const terminals = window.terminals;
	const targetTerminalOptions: TerminalOptions = {};
	let targetTerminal: Terminal | undefined;
	let shouldAttemptReuse = true;
	let shouldMatchNewest = true;

	if (!arg || typeof arg === 'string') {
		targetTerminalOptions.name = arg;
	} else if (arg) {
		shouldAttemptReuse = arg.target !== 'create new';
		shouldMatchNewest = !arg.target || arg.target !== 'oldest';
		targetTerminalOptions.name = arg.name;
		targetTerminalOptions.cwd = arg.cwd;
		// @ts-expect-error future me problem
		targetTerminalOptions.color = arg.iconColor && new ThemeColor(arg.iconColor);
		if (arg.icon) {
			targetTerminalOptions.iconPath = new ThemeIcon(arg.icon);
		}
	}

	if (shouldAttemptReuse) {
		if (targetTerminalOptions.name) {
			const termsToQuery = shouldMatchNewest ? [...terminals].reverse() : terminals;
			targetTerminal = termsToQuery.find(term => term.name === targetTerminalOptions.name);
		} else {
			targetTerminalOptions.name = undefined;
			terminals.forEach(term => term.creationOptions.name === undefined && nonTaskTerminals.add(term));
			nonTaskTerminals.forEach(nonTaskTerm => !terminals.includes(nonTaskTerm) && nonTaskTerminals.delete(nonTaskTerm));
			const termsToQuery = shouldMatchNewest ? [...nonTaskTerminals].reverse() : [...nonTaskTerminals];
			targetTerminal = termsToQuery[0];
		}
	}

	targetTerminal ||= window.createTerminal(targetTerminalOptions);

	nonTaskTerminals.add(targetTerminal);

	if (!deferShow) {
		targetTerminal.show();
	}

	return targetTerminal;
}
