import { commands, extensions, ThemeIcon, Uri, window, workspace, type QuickInputButton, type QuickPickItem } from 'vscode';
import { hasArgs } from './args';
import { CommandId } from './commands';
import { toggleStatusBarCommand } from './commands/toggleStatusBarCommand';
import { $config, $state } from './extension';
import { run } from './run';
import { RunCommandTreeItem } from './TreeViewProvider';
import { type Runnable, type TopLevelCommands } from './types';
import { extensionUtils } from './utils/extensionUtils';
import { utils } from './utils/utils';
import { vscodeUtils } from './utils/vscodeUtils';
import { isWorkspaceCommandItem } from './workspaceCommands';

type QuickPickItemWithMetadata = QuickPickItem & {
	runnable: Runnable;
	/**
	 * Command id (unique key in `commands.commands`)
	 */
	key: string;
};

/**
 * Show quick pick with user commands. After picking one - run it.
 * @param isFolder true when running folder
 */
export async function showQuickPick(commandsForPicking: TopLevelCommands, isFolder = false): Promise<void> {
	const treeAsOneLevelMap: Record<string, {
		runnable: Runnable;
		parentFolderName?: string;
	}> = {};
	function traverseCommands(items: TopLevelCommands, parentFolderName?: string): void {
		for (const key in items) {
			const runnable = items[key];
			if (extensionUtils.isCommandFolder(runnable)) {
				traverseCommands(runnable.nestedItems, key);
			} else {
				treeAsOneLevelMap[key] = {
					runnable,
					parentFolderName,
				};
			}
		}
	}
	traverseCommands(commandsForPicking);

	const newCommandButton: QuickInputButton = {
		iconPath: new ThemeIcon('add'),
		tooltip: 'Add new command',
	};

	const revealCommandInlineButton: QuickInputButton = {
		iconPath: new ThemeIcon('go-to-file'),
		tooltip: 'Reveal in settings.json',
	};
	const toggleStatusBarInlineButton: QuickInputButton = {
		iconPath: new ThemeIcon('statusBar'),
		tooltip: 'Toggle Status Bar item',
	};

	const userCommands: QuickPickItemWithMetadata[] = Object.keys(treeAsOneLevelMap).map(label => ({
		// @ts-expect-error any
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		label: `${treeAsOneLevelMap[label]?.runnable?.icon ? `$(${treeAsOneLevelMap[label].runnable?.icon}) ` : ''}${label}`,
		buttons: [
			revealCommandInlineButton,
			typeof treeAsOneLevelMap[label].runnable === 'string' ? undefined : toggleStatusBarInlineButton,
		].filter(utils.nonNullable),
		description: treeAsOneLevelMap[label].parentFolderName ? `$(folder) ${treeAsOneLevelMap[label].parentFolderName ?? ''}` : undefined,

		runnable: treeAsOneLevelMap[label].runnable,
		key: label,
	}));

	let pickedItem: QuickPickItemWithMetadata | undefined;
	const quickPick = window.createQuickPick();
	quickPick.matchOnDescription = true;
	quickPick.matchOnDetail = true;
	quickPick.title = 'Run command';

	if ($config.quickPickIncludeAllCommands && !isFolder) {
		const allCommandPaletteCommands = convertVscodeCommandToQuickPickItem(await getAllCommandPaletteCommands());
		// dedup?
		quickPick.items = [
			...userCommands,
			...allCommandPaletteCommands,
		];
	} else {
		quickPick.items = userCommands;
	}

	quickPick.buttons = [
		newCommandButton,
	];
	quickPick.onDidTriggerItemButton(async e => {
		const label = (e.item as QuickPickItemWithMetadata).key;
		const clickedItem = treeAsOneLevelMap[label];
		if (e.button.tooltip === revealCommandInlineButton.tooltip) {
			await vscodeUtils.openSettingsJson(isWorkspaceCommandItem(clickedItem) ? 'workspace' : 'global');
			vscodeUtils.goToSymbol(window.activeTextEditor, label);
		} else if (e.button.tooltip === toggleStatusBarInlineButton.tooltip) {
			const tempTreeItem = new RunCommandTreeItem({
				label,
				runnable: clickedItem.runnable,
			});
			toggleStatusBarCommand(tempTreeItem);
			// Don't hide it when toggling status bar
			return;
		}
		quickPick.hide();
		quickPick.dispose();
	});
	quickPick.onDidChangeSelection(e => {
		pickedItem = (e as QuickPickItemWithMetadata[])[0];
	});
	quickPick.onDidTriggerButton(e => {
		if (e.tooltip === newCommandButton.tooltip) {
			commands.executeCommand(CommandId.NewCommand);
		}
		quickPick.hide();
		quickPick.dispose();
	});

	quickPick.onDidAccept(async () => {
		if (pickedItem) {
			await run(pickedItem.runnable);
		}
		quickPick.hide();
		quickPick.dispose();
	});
	quickPick.show();
}

/**
 * - Convert command ids to {@link QuickPickItem `QuickPickItem[]`}
 * - Add `args` detail to commands that can accept arguments.
 */
export function commandsToQuickPickItems(commandList: string[]): QuickPickItemWithMetadata[] {
	const quickPickItems: QuickPickItemWithMetadata[] = [];
	for (const com of commandList) {
		quickPickItems.push({
			label: `${com}${hasArgs(com) ? ' ($(pass-filled) args)' : ''}`,
			key: com,
			runnable: com,
		});
	}
	return quickPickItems;
}

function convertVscodeCommandToQuickPickItem(commanList: VscodeCommand[]): QuickPickItemWithMetadata[] {
	return commanList.map((com): QuickPickItemWithMetadata => ({
		label: com.title,
		detail: com.command,
		runnable: {
			command: com.command,
		},
		key: com.title,
	}));
}

interface VscodeCommand {
	command: string;
	title: string;
	category?: string;
}

export type VscodeCommandWithoutCategory = Omit<VscodeCommand, 'category'>;

export async function getAllCommandPaletteCommands(): Promise<VscodeCommandWithoutCategory[]> {
	if ($state.allCommandPaletteCommands.length) {
		return $state.allCommandPaletteCommands;
	}
	const commandsFromExtensions = getAllCommandsFromExtensions();
	const builtinCommands = await getAllBuiltinCommands();
	const allCommandPaletteCommands = [
		...builtinCommands,
		...commandsFromExtensions,
	];
	$state.allCommandPaletteCommands = allCommandPaletteCommands;
	return allCommandPaletteCommands;
}

async function getAllBuiltinCommands(): Promise<VscodeCommandWithoutCategory[]> {
	const commandsDataPath = $state.context.asAbsolutePath('./data/commandTitleMap.json');
	try {
		const titleMapContent = await vscodeUtils.readFileVscode(commandsDataPath);
		const fileContentAsObject: Record<string, string> = JSON.parse(titleMapContent) as Record<string, string>;
		const result: VscodeCommandWithoutCategory[] = [];
		for (const key in fileContentAsObject) {
			result.push({
				command: key,
				title: fileContentAsObject[key],
			});
		}
		return result;
	} catch (e) {
		window.showErrorMessage(`Failed to get builtin commands: ${String(e)}`);
	}
	return [];
}

function getAllCommandsFromExtensions(): VscodeCommandWithoutCategory[] {
	const coms: VscodeCommandWithoutCategory[] = [];
	for (const extension of extensions.all) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const contributedCommands: VscodeCommand[] | undefined = extension.packageJSON?.contributes?.commands as VscodeCommand[];
		if (contributedCommands) {
			coms.push(...contributedCommands.map(command => ({
				command: command.command,
				title: `${command.category ? `${command.category}: ` : ''}${command.title}`,
			})));
		}
	}
	return coms;
}
