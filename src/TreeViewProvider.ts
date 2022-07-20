import { Command, Event, EventEmitter, MarkdownString, ThemeColor, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { CommandId } from './commands';
import { $config } from './extension';
import { createFolderHoverText } from './folderHoverText';
import { CommandFolder, Runnable, TopLevelCommands } from './types';
import { isSimpleObject } from './utils';

/**
 * Ordinary tree item. Can have icon (with or without color).
 * Shows markdown tooltip on hover with json version of it's contents.
 */
export class RunCommandTreeItem extends TreeItem {
	collapsibleState = TreeItemCollapsibleState.None;
	contextValue = 'command';

	constructor(
		label: string,
		readonly command: Command | undefined,
		readonly runnable: Runnable,
		icon?: string,
		iconColor?: string,
	) {
		super(label);
		if (icon) {
			this.iconPath = new ThemeIcon(icon, new ThemeColor(iconColor ?? ''));
		}
		if (typeof runnable === 'string') {
			this.contextValue = 'stringCommand';// Can't add to status bar
		}
		// @ts-ignore
		if (runnable.statusBar && !runnable.statusBar.hidden) {
			this.description = $config.treeViewStatusBarVisibleSymbol;
		}
	}
	getLabelName(): string {
		return typeof this.label === 'string' ? this.label : '';
	}
}
/**
 * Folder uses icons from active file icon theme.
 */
export class FolderTreeItem extends TreeItem {
	collapsibleState = $config.treeViewCollapseFolders ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded;
	contextValue = 'folder';
	iconPath = ThemeIcon.Folder;
	nestedItems: TopLevelCommands;

	constructor(
		label: string,
		readonly folder: CommandFolder,
	) {
		super(label);
		this.nestedItems = folder.nestedItems!;

		if (folder.statusBar && !folder.statusBar.hidden) {
			this.description = $config.treeViewStatusBarVisibleSymbol;
		}
	}

	getLabelName(): string {
		return typeof this.label === 'string' ? this.label : '';
	}
}


export class CommandsTreeViewProvider implements TreeDataProvider<FolderTreeItem | RunCommandTreeItem> {
	private readonly _onDidChangeTreeData: EventEmitter<FolderTreeItem | RunCommandTreeItem | undefined> = new EventEmitter<FolderTreeItem | RunCommandTreeItem | undefined>();
	readonly onDidChangeTreeData: Event<FolderTreeItem | RunCommandTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private commands: TopLevelCommands,
	) { }

	refresh(e?: FolderTreeItem | RunCommandTreeItem): void {
		this._onDidChangeTreeData.fire(e);
	}
	/**
	 * Resolve `tooltip` only on hover
	 */
	resolveTreeItem(_: FolderTreeItem | RunCommandTreeItem, el: FolderTreeItem | RunCommandTreeItem) {
		let markdown = new MarkdownString(undefined, true);
		markdown.isTrusted = true;
		if (el instanceof FolderTreeItem) {
			if (Object.keys(el.nestedItems).length === 0) {
				return undefined;
			}
			markdown = createFolderHoverText(el.nestedItems);
		} else {
			if (isSimpleObject(el.runnable) && el.runnable.disableTooltip) {
				return el;
			}
			markdown.appendCodeblock(JSON.stringify(el.runnable, null, '  '), 'json');
		}
		el.tooltip = markdown;
		return el;
	}

	updateCommands(commands: TopLevelCommands): void {
		this.commands = commands;
	}

	getTreeItem(element: RunCommandTreeItem): TreeItem {
		return element;
	}

	getChildren(element?: FolderTreeItem | RunCommandTreeItem): (FolderTreeItem | RunCommandTreeItem)[] {
		if (element instanceof FolderTreeItem) {
			return this.commandsToTreeItems(element.nestedItems);
		} else {
			const allCommands = this.commands;
			return this.commandsToTreeItems(allCommands);
		}
	}
	/**
	 * Convert extension commands to `TreeItem` (`FolderTreeItem` or `RunCommandTreeItem`)
	 */
	private commandsToTreeItems(items: TopLevelCommands): (FolderTreeItem | RunCommandTreeItem)[] {
		const result: (FolderTreeItem | RunCommandTreeItem)[] = [];
		for (const key in items) {
			const item = items[key];
			if (item.hidden) {
				continue;
			}
			let runnable: Runnable = [];

			if (typeof item === 'string') {
				runnable = item;
			} else if (isSimpleObject(item)) {
				runnable = item;
			}

			if (item.nestedItems) {
				result.push(new FolderTreeItem(
					key,
					item,
				));
			} else {
				result.push(new RunCommandTreeItem(
					key,
					{
						command: CommandId.Run,
						title: 'Run Command',
						arguments: [runnable],
					},
					runnable,
					item.icon,
					item.iconColor,
				));
			}
		}
		return result;
	}
}
