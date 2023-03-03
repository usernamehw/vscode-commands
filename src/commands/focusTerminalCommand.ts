import { Terminal, TerminalOptions, ThemeColor, ThemeIcon, window } from 'vscode';
import { CodiconName, codiconNames } from '../codiconNames';

interface FocusTerminalArgs {
	name?: string;
	icon?: CodiconName;
	iconColor?: string;
	cwd?: string;
	which?: 'create new' | 'newest' | 'oldest';
}

globalThis.nonTaskTerminals ??= new Set();

export function focusTerminalCommand(arg: FocusTerminalArgs | string, deferShow?: boolean) {
	const allExtantTerminals = window.terminals;
	const targetTermOpts: TerminalOptions = {};
	let targetTerm: Terminal | undefined;
	let shouldAttemptReuse = true;
	let shouldMatchNewest = true;
	if (!arg || typeof arg === 'string') {
		targetTermOpts.name = arg;
	} else if (arg) {
		shouldAttemptReuse = arg.which !== 'create new';
		shouldMatchNewest = !arg.which || arg.which !== 'oldest';
		targetTermOpts.name = arg.name;
		targetTermOpts.cwd = arg.cwd;
		targetTermOpts.color = arg.iconColor && new ThemeColor(arg.iconColor);
		targetTermOpts.iconPath = (arg.icon && codiconNames.includes(arg.icon) && new ThemeIcon(arg.icon)) || undefined;
	}
	if (shouldAttemptReuse) {
		if (!targetTermOpts.name) {
			targetTermOpts.name = undefined;
			allExtantTerminals.forEach(extantTerm => extantTerm.creationOptions.name === undefined && nonTaskTerminals.add(extantTerm));
			nonTaskTerminals.forEach(nonTaskTerm => !allExtantTerminals.includes(nonTaskTerm) && nonTaskTerminals.delete(nonTaskTerm));
			const termsToQuery = shouldMatchNewest ? [...nonTaskTerminals].reverse() : [...nonTaskTerminals];
			targetTerm = termsToQuery[0];
		} else {
			const termsToQuery = shouldMatchNewest ? [...allExtantTerminals].reverse() : allExtantTerminals;
			targetTerm = termsToQuery.find(term => term.name === targetTermOpts.name);
		}
	}
	targetTerm ||= window.createTerminal(targetTermOpts);
	nonTaskTerminals.add(targetTerm);
	if (!deferShow) {
		targetTerm.show();
	}
	return targetTerm;
}
