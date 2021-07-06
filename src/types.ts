export interface ExtensionConfig {
	/**
	 * Main config. Items to show in Tree View.
	 */
	commands: TopLevelCommands;
	/**
	 * Use shorter command ids.
	 */
	alias: Record<string, string>;
	/**
	 * Whether Tree View shows folders collapsed by default or not.
	 */
	treeViewCollapseFolders: boolean;
	/**
	 * Adds all items to Command Palette (Requires editor reload).
	 */
	populateCommandPalette: boolean;
	/**
	 * Allow string `\"args\"` to contain some of the variables from [variables-reference](https://code.visualstudio.com/docs/editor/variables-reference)
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
}
/**
 * Main configuration property. Can contain folders or command objects.
 * Folders cannot contain folders.
 */
export interface TopLevelCommands {
	[key: string]: CommandFolder & CommandObject;// TODO: ideally it would also have `| string`
}

export type Runnable = CommandObject | Sequence | string;

export interface CommandObject {
	command: string;
	args?: unknown;
	delay?: number;
	icon?: string;
	iconColor?: string;
	statusBar?: StatusBar;
	sequence?: Sequence;
	hidden?: boolean;
}
/**
 * Add command/folder to status bar
 */
interface StatusBar {
	alignment: 'left' | 'right';
	text: string;
	priority?: number;
	tooltip?: string;
	color?: string;
}
export type Sequence = (CommandObject | string)[];
/**
 * Folder can only have `nestedItems` property.
 */
export interface CommandFolder {
	nestedItems?: TopLevelCommands;
	statusBar?: StatusBar;
	hidden?: boolean;
}

// ──────────────────────────────────────────────────────────────────────
/**
 * Type for `toggleSetting` command.
 */
export interface ToggleSetting {
	setting: string;
	value: unknown[] | string;
}
