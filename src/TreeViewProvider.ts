import { Command, Event, EventEmitter, MarkdownString, ThemeColor, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { CommandIds } from './commands';
import { extensionConfig } from './extension';
import { ExtensionConfig, Runnable, TopLevelCommands } from './types';
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
	}
	getLabelName(): string {
		return typeof this.label === 'string' ? this.label : '';
	}
	// @ts-ignore
	get tooltip() {
		const markdown = new MarkdownString(undefined, true);
		markdown.isTrusted = true;
		markdown.appendCodeblock(JSON.stringify(this.runnable, null, '  '), 'json');
		return markdown;
	}
}
/**
 * Folder uses icons from active file icon theme.
 */
export class FolderTreeItem extends TreeItem {
	collapsibleState = extensionConfig.treeViewCollapseFolders ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded;
	contextValue = 'folder';
	iconPath = ThemeIcon.Folder;
	nestedItems: TopLevelCommands;

	constructor(
		label: string,
		nestedItems: TopLevelCommands,
	) {
		super(label);
		this.nestedItems = nestedItems;
	}

	getLabelName(): string {
		return typeof this.label === 'string' ? this.label : '';
	}
	// TODO: maybe tooltip should show all nested items?
}


export class CommandsTreeViewProvider implements TreeDataProvider<FolderTreeItem | RunCommandTreeItem> {
	private readonly _onDidChangeTreeData: EventEmitter<FolderTreeItem | RunCommandTreeItem | undefined> = new EventEmitter<FolderTreeItem | RunCommandTreeItem | undefined>();
	readonly onDidChangeTreeData: Event<FolderTreeItem | RunCommandTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private config: ExtensionConfig,
	) { }

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	updateConfig(newConfig: ExtensionConfig): void {
		this.config = newConfig;
	}

	getTreeItem(element: RunCommandTreeItem): TreeItem {
		return element;
	}

	getChildren(element?: FolderTreeItem | RunCommandTreeItem): (FolderTreeItem | RunCommandTreeItem)[] {
		if (element instanceof FolderTreeItem) {
			return this.commandsToTreeItems(element.nestedItems);
		} else {
			const allCommands = this.config.commands;
			return this.commandsToTreeItems(allCommands);
		}
	}
	/**
	 * Convert extension config to `TreeItem` (`FolderTreeItem` or `RunCommandTreeItem`)
	 */
	private commandsToTreeItems(items: TopLevelCommands & TopLevelCommands): (FolderTreeItem | RunCommandTreeItem)[] {
		const result: (FolderTreeItem | RunCommandTreeItem)[] = [];
		for (const key in items) {
			const item = items[key];
			if (item.hidden) {
				continue;
			}
			let runnable: Runnable = [];

			if (isSimpleObject(item)) {
				runnable = item;
			}

			if (item.nestedItems) {
				result.push(new FolderTreeItem(
					key,
					item.nestedItems,
				));
			} else {
				result.push(new RunCommandTreeItem(
					key,
					{
						command: CommandIds.run,
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
