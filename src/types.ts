export type ExtensionConfig = Readonly<{
	/**
	 * Main config. Items to show in Tree View.
	 */
	commands: TopLevelCommands;
	/**
	 * Use shorter command ids.
	 */
	alias: Alias;
	/**
	 * Whether Tree View shows folders collapsed by default or not.
	 */
	treeViewCollapseFolders: boolean;
	/**
	 * Adds all items to Command Palette (Requires editor reload).
	 */
	populateCommandPalette: boolean;
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
}>;

export interface Alias {
	[key: string]: string;
}

export interface TopLevelCommands {
	[key: string]: CommandFolder & CommandObject;
}

export type Runnable = CommandObject | CommandObject[];

export interface CommandObject {
	command: string;
	args?: unknown;
	delay?: number;
	icon?: string;
	iconColor?: string;
	statusBar?: {
		alignment: 'left' | 'right';
		text: string;
		priority?: number;
		tooltip?: string;
		color?: string;
	};
	sequence?: CommandObject[];
}
export interface CommandFolder {
	nestedItems?: NestedItems;
}

export type NestedItems = TopLevelCommands;

// ──────────────────────────────────────────────────────────────────────
export interface ToggleSetting {
	setting: string;
	value: unknown[] | string;
}
