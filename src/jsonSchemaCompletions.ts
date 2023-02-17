import { findNodeAtOffset, getNodePath, getNodeValue, Node, parseTree } from 'jsonc-parser';
import { CompletionItem, CompletionItemKind, ExtensionContext, languages, Position, Range } from 'vscode';
import { CommandId } from './commands';
import { Constants } from './extension';
import { getAllCommandPaletteCommands } from './quickPick';
import { getAllVscodeCommands } from './utils';

export function registerJsonSchemaCompletion(context: ExtensionContext): void {
	// ────────────────────────────────────────────────────────────
	// ──── keybindings.json ──────────────────────────────────────
	// ────────────────────────────────────────────────────────────
	context.subscriptions.push(languages.registerCompletionItemProvider({
		pattern: '**/{keybindings.json}',
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
			const patchMatches = (compare: string[], useStartsWith = false) => {
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

			const keybinding = getNodeValue(keybindingNode);
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
		pattern: '**/{settings.json}',
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
 * Check if cursor is in the json node named `command` and `command` is somewhere inside of
 * `commands.commands`/`commands.workspaceCommands` setting.
 */
function isCommandIdAutocomplete(comparePath: (number | string)[]): boolean {
	return (
		comparePath[0] === Constants.CommandsSettingId ||
		comparePath[0] === Constants.WorkspaceCommandsSettingId
	) && comparePath.slice(-1)?.[0] === 'command';
}

/**
 * Return all registered command ids as completion items.
 * Add command title as detail.
 */
async function getAllCommandsForAutocomplete(startPosition: Position, endPosition: Position): Promise<CompletionItem[]> {
	const commandTitles = Object.fromEntries((await getAllCommandPaletteCommands().catch(() => []))
		.map(({ command, title }) => [command, title]));
	const commandsList = await getAllVscodeCommands();

	return commandsList.map((command, i) => ({
		label: command,
		kind: CompletionItemKind.Enum,
		detail: commandTitles[command],
		range: new Range(startPosition, endPosition),
		// ensure builtin commands showed earlier
		sortText: i.toString().padStart(5, '0'),
	}));
}
