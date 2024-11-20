import { QuickPickItem } from 'vscode';

export interface ExtensionConfig {
	/**
	 * Main config. Items to show in Tree View.
	 */
	commands: TopLevelCommands;
	/**
	 * Workspace specific config. Addition items to show in Tree View, for each workspace.
	 */
	workspaceCommands: TopLevelCommands;
	/**
	 * Use shorter command ids.
	 */
	alias: Record<string, string>;
	/**
	 * Whether or not to show keyboard shortcuts assigned to command contributed by user.
	 */
	showKeybindings: boolean;
	/**
	 * Whether Tree View shows folders collapsed by default or not.
	 */
	treeViewCollapseFolders: boolean;
	/**
	 * Symbol used in the tree view to indicate that command is also visible in the status bar.
	 */
	treeViewStatusBarVisibleSymbol: string;
	/**
	 * Symbol used in the tree view to indicate workspace command (from `#commands.workspaceCommands#`) setting.
	 */
	treeViewWorkspaceCommandSymbol: string;
	/**
	 * When checked - include all commands from Command Palette to the Quick Pick.
	 */
	quickPickIncludeAllCommands: boolean;
	/**
	 * Adds all items to Command Palette (Requires editor reload).
	 */
	populateCommandPalette: boolean;
	/**
	 * Allow `\"args\"` to replace variables: [📚 Docs](https://github.com/usernamehw/vscode-commands/blob/master/docs/documentation.md#variable-substitution).
	 */
	variableSubstitutionEnabled: boolean;
	/**
	 * Add ability to run commands as links in documents. Links have format `@command?args@`. https://github.com/usernamehw/vscode-commands/issues/2
	 */
	documentLinksEnabled: boolean;
	/**
	 * Glob for which document should have document links enabled.
	 */
	documentLinksPattern: string;
	/**
	 * Controls the text of Status Bar item when adding from Tree View context menu.
	 */
	statusBarDefaultText: 'pick' | 'same';
	/**
	 * Where to put command on Status Bar (left of right).
	 */
	statusBarDefaultPosition: 'left' | 'right';
	toggleSettings: {
		/**
		* When enabled - show notification after using `commands.toggleSetting` or `commands.incrementSetting`.
		*/
		showNotification: boolean;
	};

	/**
	 * Enable status bar indicator that is supposed to show the status of a running in terminal command (`dev` | `watch`...). Will only work with contributed terminal profile `Commands:Watch`. Status of errors might not be perfect because it relies on simple text match.
	 */
	watchTerminalStatusBar: {
		enabled: boolean;
		defaultText: string;
		errorText: string;
		warningText: string;
		successText: string;
		commandOnClick: string;
		commandOnClickWhenRunning: string;
		sendText: string;
		showTerminal: boolean;
		terminalIcon: string;
		terminalIconColor: string;
		errorWhen: string[];
		warningWhen: string[];
		successWhen: string[];
		highlightErrorWithBackground: boolean;
		highlightWarningWithBackground: boolean;
		tooltipEnabled: boolean;
		replaceInTooltip: Record<string, string>;
		alignment: 'left' | 'right';
		priority: number;
	};
}
/**
 * Main configuration property. Can contain folders or command objects.
 */
export type TopLevelItem = CommandFolder | CommandObject | string;
export type TopLevelCommands = Record<string, TopLevelItem>;

export type Sequence = (CommandObject | string)[];
export type Runnable = CommandObject | Sequence | string;

export type Inputs = (InputCommand | InputPickString | InputPromptString)[];
interface InputPromptString {
	id: string;
	type: 'promptString';
	description?: string;
	default?: string;
	password?: boolean;
	convertType?: 'boolean' | 'number';
}

interface InputQuickPickitem extends QuickPickItem {
	value: string;
}

export type InputPickStringOption = InputQuickPickitem | string | undefined;

interface InputPickString {
	id: string;
	type: 'pickString';
	options: string[];
	description?: string;
	default?: string;
}
interface InputCommand {
	id: string;
	type: 'command';
	command: string;
	args?: unknown;
}

/**
 * Most used type of command.
 */
export interface CommandObject {
	command: string;
	args?: unknown;
	delay?: number;
	/**
	 * Run this command or sequence **repeat** number of times.
	 */
	repeat?: number;
	icon?: string;
	markdownTooltip?: string;
	disableTooltip?: boolean;
	iconColor?: string;
	statusBar?: StatusBar;
	sequence?: Sequence;
	hidden?: boolean;
	when?: string;
	workspace?: string;
	inputs?: Inputs;
}
/**
 * Add command/folder to status bar
 */
interface StatusBar {
	alignment?: 'left' | 'right';
	text: string;
	name?: string;
	priority?: number;
	tooltip?: string;
	markdownTooltip?: string;
	hidden?: boolean;
	color?: string;
	backgroundColor?: 'error' | 'warning';
	activeEditorGlob?: string;
	activeEditorLanguage?: string;
	updateEvents?: UpdateEvent[];
}
interface UpdateEventonDidConfigurationChange {
	kind: 'onDidConfigurationChange';
	settings?: string[];
}
interface UpdateEventonDidChangeActiveTextEditor {
	kind: 'onDidChangeActiveTextEditor';
}
interface UpdateEventonDidChangeTextEditorSelection {
	kind: 'onDidChangeTextEditorSelection';
}
interface UpdateEventInterval {
	kind: 'interval';
	value?: number;
}
type UpdateEvent = UpdateEventInterval | UpdateEventonDidChangeActiveTextEditor | UpdateEventonDidChangeTextEditorSelection | UpdateEventonDidConfigurationChange;
/**
 * Folder can only have `nestedItems` property.
 */
export interface CommandFolder {
	/**
	 * If this exists - item is a folder.
	 */
	nestedItems: TopLevelCommands;
	statusBar?: StatusBar;
	hidden?: boolean;
	workspace?: string;
	when?: string;
}
