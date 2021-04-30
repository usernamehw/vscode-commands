import { Command, Event, EventEmitter, ThemeColor, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { CommandIds } from './commands';
import { extensionConfig } from './extension';
import { ExtensionConfig, NestedItems, Runnable, TopLevelCommands } from './types';
import { isSimpleObject } from './utils';

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
}

export class FolderTreeItem extends TreeItem {
	collapsibleState = extensionConfig.treeViewCollapseFolders ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded;
	contextValue = 'folder';
	iconPath = ThemeIcon.Folder;
	nestedItems: NestedItems;

	constructor(
		label: string,
		nestedItems: NestedItems,
	) {
		super(label);
		this.nestedItems = nestedItems;
	}

	getLabelName(): string {
		return typeof this.label === 'string' ? this.label : '';
	}
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

	private commandsToTreeItems(items: NestedItems & TopLevelCommands): (FolderTreeItem | RunCommandTreeItem)[] {
		const result: (FolderTreeItem | RunCommandTreeItem)[] = [];
		for (const key in items) {
			const item = items[key];
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
