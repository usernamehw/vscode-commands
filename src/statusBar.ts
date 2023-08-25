import { MarkdownString, StatusBarAlignment, ThemeColor, languages, window, type StatusBarItem, type TextEditor } from 'vscode';
import { CommandId } from './commands';
import { createFolderHoverText } from './folderHoverText';
import { substituteVariables } from './substituteVariables';
import { type Inputs, type TopLevelCommands } from './types';
import { extUtils } from './utils/extUtils';
import { utils } from './utils/utils';
import { vscodeUtils } from './utils/vscodeUtils';

const statusBarItems: StatusBarWithActiveEditorMetadata[] = [];

type StatusBarWithActiveEditorMetadata = StatusBarItem & {
	uniqueId: string;
	originalText: string;
	icon: string;
	activeEditorGlob?: string;
	activeEditorLanguage?: string;
	inputs?: Inputs;
};

export interface StatusBarUpdateEvents {
	onDidConfigurationChange: {
		statusBarItemId: string;
		settings?: string[];
	}[];

	onDidChangeActiveTextEditor: {
		statusBarItemId: string;
	}[];
	onDidChangeTextEditorSelection: {
		statusBarItemId: string;
	}[];
	interval: {
		statusBarItemId: string;
		value: number;
	}[];
}

/**
 * Dispose and refresh all status bar items.
 */
export function updateStatusBarItems(items: TopLevelCommands, variableSubstitutionEnabled: boolean): StatusBarUpdateEvents {
	disposeStatusBarItems();

	const statusBarUpdateEvents: StatusBarUpdateEvents = {
		onDidConfigurationChange: [],
		onDidChangeActiveTextEditor: [],
		onDidChangeTextEditorSelection: [],
		interval: [],
	};

	extUtils.forEachCommand((item, key) => {
		if (typeof item === 'string') {
			// cannot have "statusBar" on string item
			return;
		}
		if (!item.statusBar || item.statusBar.hidden) {
			return;
		}

		const uniqueId = utils.uniqueId();

		for (const updateEvent of item.statusBar.updateEvents ?? []) {
			if (updateEvent.kind === 'onDidConfigurationChange') {
				statusBarUpdateEvents.onDidConfigurationChange.push({
					statusBarItemId: uniqueId,
					settings: updateEvent.settings,
				});
			} else if (updateEvent.kind === 'onDidChangeActiveTextEditor') {
				statusBarUpdateEvents.onDidChangeActiveTextEditor.push({
					statusBarItemId: uniqueId,
				});
			} else if (updateEvent.kind === 'onDidChangeTextEditorSelection') {
				statusBarUpdateEvents.onDidChangeTextEditorSelection.push({
					statusBarItemId: uniqueId,
				});
			} else if (updateEvent.kind === 'interval') {
				statusBarUpdateEvents.interval.push({
					statusBarItemId: uniqueId,
					value: updateEvent.value ?? 1000,
				});
			}
		}

		const statusBarUserObject = item.statusBar;
		const alignment = statusBarUserObject.alignment === 'right' ? StatusBarAlignment.Right : StatusBarAlignment.Left;
		const newStatusBarItem: StatusBarWithActiveEditorMetadata = window.createStatusBarItem(key, alignment, statusBarUserObject.priority ?? -9999) as StatusBarWithActiveEditorMetadata;
		newStatusBarItem.uniqueId = uniqueId;
		newStatusBarItem.originalText = statusBarUserObject.text;
		let icon = 'icon' in item ? `$(${item.icon ?? ''}) ` : '';
		newStatusBarItem.name = `Commands: ${statusBarUserObject.name ?? statusBarUserObject.text}`;
		newStatusBarItem.color = statusBarUserObject.color;
		newStatusBarItem.backgroundColor = statusBarUserObject.backgroundColor === 'error' ?
			new ThemeColor('statusBarItem.errorBackground') :
			statusBarUserObject.backgroundColor === 'warning' ? new ThemeColor('statusBarItem.warningBackground') : undefined;

		let mdTooltip = new MarkdownString(undefined, true);
		mdTooltip.isTrusted = true;
		if (statusBarUserObject.markdownTooltip) {
			mdTooltip.appendMarkdown(statusBarUserObject.markdownTooltip);
		} else {
			mdTooltip.appendText(statusBarUserObject.tooltip ?? key);
		}
		if (extUtils.isCommandFolder(item)) {
			icon = '$(folder) ';
			mdTooltip = createFolderHoverText(item);
		}
		const args = [{
			workspaceId: item.workspace,
			label: key,
		}];
		const revealCommandUri = vscodeUtils.createCommandUri(CommandId.RevealCommand2, args);
		mdTooltip.appendMarkdown(`\n\n---\n\n[Reveal in settings.json](${revealCommandUri.toString()})`);
		newStatusBarItem.tooltip = mdTooltip;

		newStatusBarItem.text = icon + (statusBarUserObject.text || '');
		newStatusBarItem.icon = icon;
		newStatusBarItem.command = {
			command: CommandId.Run,
			title: 'Run Command',
			arguments: [item],
		};

		newStatusBarItem.activeEditorGlob = item.statusBar.activeEditorGlob;
		newStatusBarItem.activeEditorLanguage = item.statusBar.activeEditorLanguage;
		newStatusBarItem.inputs = extUtils.isCommandFolder(item) ? undefined : item.inputs;

		newStatusBarItem.show();
		statusBarItems.push(newStatusBarItem);
	}, items);

	updateStatusBarItemsVisibilityBasedOnActiveEditor(window.activeTextEditor);
	updateStatusBarTextFromEvents(variableSubstitutionEnabled, statusBarItems.map(item => item.uniqueId));

	return statusBarUpdateEvents;
}

/**
 * Control whether or not status bar item should be shown
 * based on active text editor.
 */
export function updateStatusBarItemsVisibilityBasedOnActiveEditor(editor?: TextEditor): void {
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
			continue;
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
			}, editor.document) === 0) {
				statusBarItem.hide();
			} else {
				statusBarItem.show();
			}
		}
	}
}
/**
 * Apply variable substitution for status bar text.
 */
export async function updateStatusBarTextFromEvents(variableSubstitutionEnabled: boolean, statusBarItemIds: string[]): Promise<void> {
	if (!variableSubstitutionEnabled) {
		return;
	}

	for (const statusBarItem of statusBarItems) {
		if (!statusBarItemIds.includes(statusBarItem.uniqueId)) {
			continue;
		}
		const newText = await substituteVariables(statusBarItem.originalText, statusBarItem.inputs);
		statusBarItem.text = statusBarItem.icon + newText;
	}
}
/**
 * Dispose all status bar items.
 */
function disposeStatusBarItems(): void {
	for (const statusBarItem of statusBarItems) {
		statusBarItem.dispose();
	}
	statusBarItems.length = 0;
}
