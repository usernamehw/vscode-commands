import { type FolderTreeItem } from '../TreeViewProvider';
import { newFolder } from './newFolderCommand';

export async function newFolderInFolderCommand(folderTreeItem?: FolderTreeItem): Promise<void> {
	await newFolder(folderTreeItem);
}
