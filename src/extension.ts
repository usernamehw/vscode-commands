import { commands, window, workspace, type Disposable, type ExtensionContext, type TreeView } from 'vscode';
import { updateCommandPalette } from './commandPalette';
import { registerExtensionCommands } from './commands';
import { updateDocumentLinkProvider } from './documentLinksProvider';
import { getKeybindings, type VsCodeKeybindingItem } from './getKeybindings';
import { registerJsonSchemaCompletion } from './jsonSchema/jsonSchemaCompletions';
import { registerDynamicJsonSchema } from './jsonSchema/registerDynamicJsonSchema';
import { type VscodeCommandWithoutCategory } from './quickPick';
import { updateUserCommands } from './registerUserCommands';
import { updateStatusBarItems, updateStatusBarItemsVisibilityBasedOnActiveEditor, updateStatusBarTextFromEvents, type StatusBarUpdateEvents } from './statusBar';
import { initTerminalIndicatorStatusBar } from './terminalIndicator/terminalIndicatorStatusBar';
import { CommandsTreeViewProvider, type FolderTreeItem, type RunCommandTreeItem } from './TreeViewProvider';
import { type CommandFolder, type ExtensionConfig, type Runnable, type TopLevelCommands } from './types';
import { addWorkspaceIdToCommands, getWorkspaceId, setWorkspaceIdToContext } from './workspaceCommands';

export const enum Constants {
	ExtensionId = 'usernamehw.commands',
	ExtensionSettingsPrefix = 'commands',
	ExtensionMainSettingId = 'commands.commands',
	WorkspaceCommandsSettingId = 'commands.workspaceCommands',
	CycleSettingId = 'commands.cycle',
	WatchTerminalSettingId = 'commands.watchTerminalStatusBar',
	/** Matches contributed profile in `package.json` file */
	ExtensionTerminalProfileTitle = 'Commands:Watch',

	CommandPaletteWasPopulatedStorageKey = 'was_populated',

	PackageJsonFileName = 'package.json',
	SettingsJsonFileName = 'settings.json',
	KeybindingsJsonFileName = 'keybindings.json',

	NestingSymbol = '◦',
	NonBreakingSpaceSymbol = ' ',
}

export let $config: ExtensionConfig;
export abstract class $state {
	public static lastExecutedCommand: CommandFolder | Runnable = { command: 'noop' };
	public static context: ExtensionContext;
	/**
	 * Cache all Command Palette commands for `quickPickIncludeAllCommands` feature.
	 */
	public static allCommandPaletteCommands: VscodeCommandWithoutCategory[] = [];
	public static commandsTreeViewProvider: CommandsTreeViewProvider;
	public static commandsTreeView: TreeView<FolderTreeItem | RunCommandTreeItem>;
	public static keybindings: VsCodeKeybindingItem[] = [];

	/**
	 * Remember which command was called (separately for each list of commands).
	 */
	public static cycles: Record<string, string | undefined> = {};

	public static statusBarUpdateEventDisposables: Disposable[] = [];
	public static statusBarUpdateEventTimerIds: (NodeJS.Timeout | number | string | undefined)[] = [];
}

export async function activate(context: ExtensionContext): Promise<void> {
	$state.context = context;

	updateConfig();

	$state.commandsTreeViewProvider = new CommandsTreeViewProvider({});
	$state.commandsTreeView = window.createTreeView(`${Constants.ExtensionSettingsPrefix}.tree`, {
		treeDataProvider: $state.commandsTreeViewProvider,
		showCollapseAll: true,
	});

	registerExtensionCommands();

	await setWorkspaceIdToContext(context);
	updateEverything(context, 'startup');

	registerDynamicJsonSchema(context);
	registerJsonSchemaCompletion(context);

	function updateConfig(): void {
		$config = workspace.getConfiguration(Constants.ExtensionSettingsPrefix) as unknown as ExtensionConfig;
	}

	context.subscriptions.push($state.commandsTreeView);
	context.subscriptions.push(workspace.onDidChangeConfiguration(e => {
		if (!e.affectsConfiguration(Constants.ExtensionSettingsPrefix)) {
			return;
		}

		updateConfig();
		updateEverything(context, e.affectsConfiguration(Constants.WatchTerminalSettingId) ? 'watchTerminalSettingUpdated' : '');

		if (e.affectsConfiguration(Constants.WatchTerminalSettingId)) {
			initTerminalIndicatorStatusBar();
		}
	}));

	context.subscriptions.push(window.onDidChangeActiveTextEditor(editor => {
		updateStatusBarItemsVisibilityBasedOnActiveEditor(editor);
	}));
}

/**
 * Function runs after every config update.
 */
async function updateEverything(context: ExtensionContext, updateWatchTerminalReason?: '' | 'startup' | 'watchTerminalSettingUpdated'): Promise<void> {
	const allCommands = getAllCommands();
	$state.keybindings = [];
	if ($config.showKeybindings) {
		$state.keybindings = await getKeybindings(context);
	}
	$state.commandsTreeViewProvider.updateCommands(allCommands);
	$state.commandsTreeViewProvider.refresh();
	updateUserCommands(allCommands);

	const statusBarUpdateEvents = updateStatusBarItems(allCommands, $config.variableSubstitutionEnabled);
	updateStatusBarUpdateEvents(statusBarUpdateEvents, $config.variableSubstitutionEnabled);

	if (updateWatchTerminalReason) {
		initTerminalIndicatorStatusBar();
	}

	updateCommandPalette(allCommands, context);
	updateDocumentLinkProvider();
	updateWelcomeViewContext(Object.keys(allCommands).length === 0);
}

function updateStatusBarUpdateEvents(statusBarUpdateEvents: StatusBarUpdateEvents, variableSubstitutionEnabled: boolean): void {
	disposeStatusBarUpdateEvents();
	disposeIntervalTimerIds();

	if (statusBarUpdateEvents.onDidConfigurationChange.length) {
		$state.statusBarUpdateEventDisposables.push(workspace.onDidChangeConfiguration(e => {
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
		$state.statusBarUpdateEventDisposables.push(window.onDidChangeActiveTextEditor(e => {
			updateStatusBarTextFromEvents(variableSubstitutionEnabled, statusBarUpdateEvents.onDidChangeActiveTextEditor.map(e2 => e2.statusBarItemId));
		}));
	}

	if (statusBarUpdateEvents.onDidChangeTextEditorSelection.length) {
		$state.statusBarUpdateEventDisposables.push(window.onDidChangeTextEditorSelection(e => {
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
	for (const disposable of $state.statusBarUpdateEventDisposables) {
		disposable?.dispose();
	}
	$state.statusBarUpdateEventDisposables = [];
}
function disposeIntervalTimerIds(): void {
	for (const timerId of $state.statusBarUpdateEventTimerIds) {
		clearInterval(timerId);
	}
	$state.statusBarUpdateEventTimerIds = [];
}

/**
 * Merge global and workspace commands.
 */
export function getAllCommands(): TopLevelCommands {
	const workspaceId = getWorkspaceId($state.context);
	const workspaceCommands = workspace.getConfiguration(Constants.ExtensionSettingsPrefix).inspect('workspaceCommands')?.workspaceValue as ExtensionConfig['workspaceCommands'] | undefined;
	if (workspaceId && workspaceCommands) {
		return {
			...$config.commands,
			...addWorkspaceIdToCommands(workspaceCommands, workspaceId),
		};
	} else {
		return $config.commands;
	}
}

function updateWelcomeViewContext(isEmpty: boolean): void {
	commands.executeCommand('setContext', 'commands:emptyCommands', isEmpty);
}

export function deactivate(): void { }
