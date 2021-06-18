import { CommandIds } from './commands';

export const commandArgs: {
	[commandId: string]: unknown;
} = {
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
	[CommandIds.toggleSetting]: {
		setting: '',
		value: [],
	},
	[CommandIds.incrementSetting]: {
		setting: '',
		value: 1,
	},
	[CommandIds.toggleTheme]: {
		dark: 'Default Dark+,Abyss',
		light: 'Default Light+,Quiet Light',
	},
	[CommandIds.openFolder]: '',
	[CommandIds.runInTerminal]: {
		text: '',
		name: '',
		reveal: true,
		cwd: '',
	},
	[CommandIds.startDebugging]: '',
	[CommandIds.openExternal]: '',
	[CommandIds.setEditorLanguage]: '',
	[CommandIds.clipboardWrite]: '',
	[CommandIds.installExtension]: '',
	[CommandIds.revealFileInOS]: '',
	[CommandIds.showNotification]: {
		message: '',
		severity: 'error',
	},
	[CommandIds.openInApp]: '',
};
/**
 * Add arguments if command can accept them (even if they are optional).
 */
export function addArgs(commandId: string) {
	if (commandId in commandArgs) {
		return {
			command: commandId,
			args: commandArgs[commandId],
		};
	}
	return {
		command: commandId,
	};
}
