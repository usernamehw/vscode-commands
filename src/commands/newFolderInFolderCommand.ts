import { FolderTreeItem } from '../TreeViewProvider';
import { newFolder } from './newFolderCommand';


export async function newFolderInFolderCommand(folderTreeItem?: FolderTreeItem) {
	await newFolder(folderTreeItem);
}
