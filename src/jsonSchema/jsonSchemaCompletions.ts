import { findNodeAtOffset, getNodePath, getNodeValue, parseTree, type Node } from 'jsonc-parser';
import { CompletionItemKind, languages, Range, type CompletionItem, type ExtensionContext, type Position } from 'vscode';
import { CommandId } from '../commands';
import { Constants } from '../extension';
import { getAllCommandPaletteCommands } from '../quickPick';
import { vscodeUtils } from '../utils/vscodeUtils';

export function registerJsonSchemaCompletion(context: ExtensionContext): void {
	// ────────────────────────────────────────────────────────────
	// ──── keybindings.json ──────────────────────────────────────
	// ────────────────────────────────────────────────────────────
	context.subscriptions.push(languages.registerCompletionItemProvider({
		pattern: `**/{${Constants.KeybindingsJsonFileName}}`,
	}, {
		async provideCompletionItems(document, position) {
			const root = parseTree(document.getText(), []);
			if (!root) {
				return;
			}

			const node = findNodeAtOffset(root, document.offsetAt(position));
			if (node?.type !== 'string') {
				return;
			}

			const jsonPath = getNodePath(node);
			const patchMatches = (compare: string[], useStartsWith = false): boolean | undefined => {
				if (!useStartsWith && compare.length !== jsonPath.length) {
					return;
				}
				return compare.every((item, i) => item === '*' || item === jsonPath[i]);
			};

			let keybindingNode: Node | undefined;
			if (patchMatches(['*', 'args', '*'])) {
				keybindingNode = node.parent?.parent?.parent;
			} else if (patchMatches(['*', 'args', '*', 'command'])) {
				keybindingNode = node?.parent?.parent?.parent?.parent?.parent;
			}
			if (!keybindingNode) {
				return;
			}

			const keybinding = getNodeValue(keybindingNode) as { command: string };
			if (keybinding.command !== CommandId.Run) {
				return;
			}

			return getAllCommandsForAutocomplete(document.positionAt(node.offset + 1), document.positionAt(node.offset + 1 + node.length - 2));
		},
	}));

	// ────────────────────────────────────────────────────────────
	// ──── settings.json ─────────────────────────────────────────
	// ────────────────────────────────────────────────────────────
	context.subscriptions.push(languages.registerCompletionItemProvider({
		pattern: `**/{${Constants.SettingsJsonFileName}}`,
	}, {
		async provideCompletionItems(document, position) {
			const root = parseTree(document.getText(), []);
			if (!root) {
				return;
			}

			const node = findNodeAtOffset(root, document.offsetAt(position));
			if (node?.type !== 'string') {
				return;
			}

			const jsonPath = getNodePath(node);
			if (!isCommandIdAutocomplete(jsonPath)) {
				return;
			}

			return getAllCommandsForAutocomplete(
				document.positionAt(node.offset + 1),
				document.positionAt(node.offset + 1 + node.length - 2),
			);
		},
	}));
}

/**
 * Check if cursor is in the json node named `command` or one lvl in `sequence` and
 * also somewhere inside of `commands.commands`/`commands.workspaceCommands` setting.
 */
function isCommandIdAutocomplete(comparePath: (number | string)[]): boolean {
	return (
		comparePath[0] === Constants.ExtensionMainSettingId ||
		comparePath[0] === Constants.WorkspaceCommandsSettingId
	) && (
		comparePath.slice(-1)?.[0] === 'command' ||
		comparePath.slice(-2)?.[0] === 'sequence'
	);
}

/**
 * Return all registered command ids as completion items.
 * Add command title as detail.
 */
async function getAllCommandsForAutocomplete(startPosition: Position, endPosition: Position): Promise<CompletionItem[]> {
	const commandTitles = Object.fromEntries((await getAllCommandPaletteCommands().catch(() => []))
		.map(({ command, title }) => [command, title]));
	const commandsList = await vscodeUtils.getAllVscodeCommands();

	return commandsList.map((command, i) => ({
		label: command,
		kind: CompletionItemKind.Enum,
		detail: commandTitles[command],
		range: new Range(startPosition, endPosition),
		// ensure builtin commands showed earlier
		sortText: i.toString().padStart(5, '0'),
	}));
}
