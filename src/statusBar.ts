import { languages, MarkdownString, StatusBarAlignment, StatusBarItem, TextEditor, ThemeColor, Uri, window } from 'vscode';
import { CommandId } from './commands';
import { createFolderHoverText } from './folderHoverText';
import { TopLevelCommands } from './types';
import { forEachCommand } from './utils';

const statusBarItems: StatusBarWithActiveEditorMetadata[] = [];

type StatusBarWithActiveEditorMetadata = StatusBarItem & {
	activeEditorGlob?: string;
	activeEditorLanguage?: string;
};

/**
 * Dispose and refresh all status bar items.
 */
export function updateStatusBarItems(items: TopLevelCommands): void {
	disposeStatusBarItems();

	forEachCommand((item, key) => {
		if (item.statusBar && !item.statusBar.hidden) {
			const statusBarUserObject = item.statusBar;
			const alignment = statusBarUserObject.alignment === 'right' ? StatusBarAlignment.Right : StatusBarAlignment.Left;
			const newStatusBarItem: StatusBarWithActiveEditorMetadata = window.createStatusBarItem(statusBarUserObject.text, alignment, statusBarUserObject.priority ?? -9999);
			let icon = item.icon ? `$(${item.icon}) ` : '';
			newStatusBarItem.name = `Commands: ${statusBarUserObject.name || statusBarUserObject.text}`;
			newStatusBarItem.color = statusBarUserObject.color;
			newStatusBarItem.backgroundColor = statusBarUserObject.backgroundColor === 'error' ? new ThemeColor('statusBarItem.errorBackground') :
				statusBarUserObject.backgroundColor === 'warning' ? new ThemeColor('statusBarItem.warningBackground') : undefined;

			let mdTooltip = new MarkdownString(undefined, true);
			mdTooltip.isTrusted = true;
			if (statusBarUserObject.markdownTooltip) {
				mdTooltip.appendMarkdown(statusBarUserObject.markdownTooltip);
			} else {
				mdTooltip.appendText(statusBarUserObject.tooltip || key);
			}
			if (item.nestedItems) {
				icon = '$(folder) ';
				mdTooltip = createFolderHoverText(item.nestedItems);
			}
			const args = [{
				workspaceId: item.workspace,
				label: key,
			}];
			const revealCommandUri = Uri.parse(
				`command:${CommandId.RevealCommand2}?${encodeURIComponent(JSON.stringify(args))}`,
			);
			mdTooltip.appendMarkdown(`\n\n---\n\n[Reveal in settings.json](${revealCommandUri})`);
			newStatusBarItem.tooltip = mdTooltip;

			newStatusBarItem.text = icon + (statusBarUserObject.text || '');
			newStatusBarItem.command = {
				command: CommandId.Run,
				title: 'Run Command',
				arguments: [item],
			};

			newStatusBarItem.activeEditorGlob = item.statusBar.activeEditorGlob;
			newStatusBarItem.activeEditorLanguage = item.statusBar.activeEditorLanguage;

			newStatusBarItem.show();
			statusBarItems.push(newStatusBarItem);
		}
	}, items);

	updateStatusBarItemsVisibilityBasedOnActiveEditor(window.activeTextEditor);
}

/**
 * Control whether or not status bar item should be shown
 * based on active text editor.
 */
export function updateStatusBarItemsVisibilityBasedOnActiveEditor(editor?: TextEditor) {
	// No active text editor (no editor opened).
	if (!editor) {
		for (const statusBarItem of statusBarItems) {
			if (!statusBarItem.activeEditorLanguage && !statusBarItem.activeEditorGlob) {
				statusBarItem.show();
			} else {
				statusBarItem.hide();
			}
		}
		return;
	}

	// Active text editor exists.
	for (const statusBarItem of statusBarItems) {
		if (!statusBarItem.activeEditorGlob && !statusBarItem.activeEditorLanguage) {
			statusBarItem.show();
			return;
		}
		if (statusBarItem.activeEditorLanguage) {
			if (editor.document.languageId === statusBarItem.activeEditorLanguage) {
				statusBarItem.show();
			} else {
				statusBarItem.hide();
			}
		}
		if (statusBarItem.activeEditorGlob) {
			if (languages.match({
				pattern: statusBarItem.activeEditorGlob || '',
			}, editor.document) !== 0) {
				statusBarItem.show();
			} else {
				statusBarItem.hide();
			}
		}
	}
}
/**
 * Dispose all status bar items.
 */
function disposeStatusBarItems() {
	for (const statusBarItem of statusBarItems) {
		statusBarItem.dispose();
	}
	statusBarItems.length = 0;
}
