import { Disposable, window, workspace } from 'vscode';
import { $state } from './extension';
import { StatusBarUpdateEvents, updateStatusBarTextFromEvents } from './statusBar';

let statusBarUpdateEventDisposables: Disposable[] = [];
let statusBarUpdateEventTimerIds: (NodeJS.Timeout | number | string | undefined)[] = [];

let treeViewUpdateEventDisposables: Disposable[] = [];

export function updateStatusBarUpdateEvents(statusBarUpdateEvents: StatusBarUpdateEvents, variableSubstitutionEnabled: boolean): void {
	disposeStatusBarUpdateEvents();
	disposeIntervalTimerIds();

	if (statusBarUpdateEvents.onDidConfigurationChange.length) {
		statusBarUpdateEventDisposables.push(workspace.onDidChangeConfiguration(e => {
			const statusBarIds: string[] = [];
			for (const conf of statusBarUpdateEvents.onDidConfigurationChange) {
				if (conf.settings?.length) {
					for (const setting of conf.settings) {
						if (e.affectsConfiguration(setting)) {
							statusBarIds.push(conf.statusBarItemId);
						}
					}
				} else {
					statusBarIds.push(conf.statusBarItemId);
				}
			}
			updateStatusBarTextFromEvents(variableSubstitutionEnabled, statusBarIds);
		}));
	}

	if (statusBarUpdateEvents.onDidChangeActiveTextEditor.length) {
		statusBarUpdateEventDisposables.push(window.onDidChangeActiveTextEditor(e => {
			updateStatusBarTextFromEvents(variableSubstitutionEnabled, statusBarUpdateEvents.onDidChangeActiveTextEditor.map(e2 => e2.statusBarItemId));
		}));
	}

	if (statusBarUpdateEvents.onDidChangeTextEditorSelection.length) {
		statusBarUpdateEventDisposables.push(window.onDidChangeTextEditorSelection(e => {
			updateStatusBarTextFromEvents(variableSubstitutionEnabled, statusBarUpdateEvents.onDidChangeTextEditorSelection.map(e2 => e2.statusBarItemId));
		}));
	}

	if (statusBarUpdateEvents.interval.length) {
		for (const interval of statusBarUpdateEvents.interval) {
			setInterval(() => {
				updateStatusBarTextFromEvents(variableSubstitutionEnabled, [interval.statusBarItemId]);
			}, interval.value);
		}
	}
}
function disposeStatusBarUpdateEvents(): void {
	for (const disposable of statusBarUpdateEventDisposables) {
		disposable?.dispose();
	}
	statusBarUpdateEventDisposables = [];
}
function disposeIntervalTimerIds(): void {
	for (const timerId of statusBarUpdateEventTimerIds) {
		clearInterval(timerId);
	}
	statusBarUpdateEventTimerIds = [];
}

// ────────────────────────────────────────────────────────────

export function updateTreeViewEventListeners(eventForTreeUpdateNeeded: boolean): void {
	disposeTreeViewEvents();

	if (!eventForTreeUpdateNeeded) {
		return;
	}

	treeViewUpdateEventDisposables.push(window.onDidChangeActiveTextEditor(editor => {
		if ($state.commandsTreeView.visible) {
			$state.commandsTreeViewProvider.refresh();
		}
	}));

	// Update Tree View items when it becomes visible (if any items need hiding)
	treeViewUpdateEventDisposables.push($state.commandsTreeView.onDidChangeVisibility(visibilityChangeEvent => {
		if (visibilityChangeEvent.visible) {
			$state.commandsTreeViewProvider.refresh();
		}
	}));
}

function disposeTreeViewEvents(): void {
	for (const disposable of treeViewUpdateEventDisposables) {
		disposable?.dispose();
	}
	treeViewUpdateEventDisposables = [];
}
