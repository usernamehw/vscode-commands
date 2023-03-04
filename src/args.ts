import { CommandId } from './commands';
import { $config } from './extension';

/**
 * Map commands with arguments;
 */
export const commandArgs: Record<string, unknown> = {
	type: {
		text: '',
	},
	'workbench.action.tasks.runTask': '',
	'editor.action.insertSnippet': {
		snippet: '',
	},
	'workbench.action.terminal.sendSequence': {
		text: '',
	},
	'workbench.action.quickOpen': '',
	'workbench.action.openSettings': '',
	'workbench.action.openGlobalKeybindings': '',
	'workbench.extensions.search': '',
	'vscode.openIssueReporter': '',
	'vscode.setEditorLayout': {
		 orientation: 0,
		 groups: [{
			 groups: [{}, {}],
			 size: 0.5,
		},
		{
			groups: [{}, {}],
			size: 0.5,
		}],
	},
	'workbench.action.findInFiles': {
		query: '',
		isRegex: false,
		isCaseSensitive: false,
		matchWholeWord: false,
		preserveCase: false,
		excludeSettingAndIgnoreFiles: true,
		triggerSearch: true,
		onlyOpenEditors: false,
		replace: '',
		filesToInclude: '',
		filesToExclude: '',
	},
	'search.action.openNewEditor': {
		query: '',
		isRegexp: false,
		isCaseSensitive: false,
		matchWholeWord: false,
		preserveCase: false,
		excludeSettingAndIgnoreFiles: true,
		triggerSearch: true,
		contextLines: 1,
		showIncludesExcludes: true,
		filesToInclude: '',
		filesToExclude: '',
	},
	'editor.actions.findWithArgs': {
		searchString: '',
		replaceString: '',
		isRegex: false,
		isCaseSensitive: false,
		matchWholeWord: false,
		preserveCase: false,
		findInSelection: false,
	},
	cursorMove: {
		to: 'down',
		by: 'line',
		value: 1,
		select: false,
	},
	editorScroll: {
		to: 'down',
		by: 'line',
		value: 1,
		revealCursor: false,
	},
	moveActiveEditor: {
		to: 'left',
		by: 'tab',
		value: 1,
	},
	'editor.emmet.action.wrapWithAbbreviation': {
		abbreviation: 'div',
		language: 'html',
	},
	'workbench.extensions.installExtension': '',
	'workbench.extensions.action.showExtensionsWithIds': [''],
	'editor.action.codeAction': {
		kind: '',
		apply: 'first',
		preferred: false,
	},
	[CommandId.ToggleSetting]: {
		setting: '',
		value: [],
		target: 'global',
	},
	[CommandId.IncrementSetting]: {
		setting: '',
		value: 1,
	},
	[CommandId.ToggleTheme]: {
		dark: 'Default Dark+,Abyss',
		light: 'Default Light+,Quiet Light',
	},
	[CommandId.OpenFolder]: '',
	[CommandId.RunInTerminal]: {
		text: '',
		name: '',
		reveal: true,
	},
	[CommandId.FocusTerminal]: {
		name: '',
		target: 'newest',
	},
	[CommandId.StartDebugging]: '',
	[CommandId.OpenExternal]: '',
	[CommandId.SetEditorLanguage]: '',
	[CommandId.ClipboardWrite]: '',
	[CommandId.RevealFileInOS]: '',
	[CommandId.ShowNotification]: {
		message: '',
		severity: 'error',
	},
	[CommandId.ShowStatusBarNotification]: {
		message: '',
		color: '',
		timeout: 5000,
	},
	[CommandId.Open]: {
		target: '',
		app: '',
		arguments: [''],
	},
};
/**
 * Add arguments if command can accept them (even if they are optional).
 */
export function addArgs(commandId: string): { command: string; args?: unknown } {
	if (commandId in commandArgs) {
		return {
			command: commandId,
			args: commandArgs[commandId],
		};
	}
	if (commandId in $config.alias) {
		return {
			command: commandId,
			args: commandArgs[$config.alias[commandId]],
		};
	}
	return {
		command: commandId,
	};
}
/**
 * Return `true` if command accepts arguments.
 */
export function hasArgs(commandId: string): boolean {
	return commandId in commandArgs || $config.alias[commandId] in commandArgs;
}
