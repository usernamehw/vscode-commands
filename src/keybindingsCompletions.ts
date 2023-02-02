import { findNodeAtOffset, getNodePath, getNodeValue, Node, parseTree } from 'jsonc-parser';
import { CompletionItemKind, languages, Range } from 'vscode';
import { CommandId } from './commands';
import { getAllCommandPaletteCommands } from './quickPick';
import { getAllVscodeCommands } from './utils';

export function registerJsonSchemaCompletion() {
	languages.registerCompletionItemProvider({
		pattern: '**/{keybindings.json,package.json}',
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

			let jsonPath = getNodePath(node);
			const patchMatches = (compare: string[], useStartsWith = false) => {
				if (!useStartsWith && compare.length !== jsonPath.length) {
					return;
				}
				return compare.every((item, i) => item === '*' || item === jsonPath[i]);
			};

			if (languages.match({ pattern: '**/package.json' }, document)) {
				if (!patchMatches(['contributes', 'keybindings'], true)) {
					return;
				}
				jsonPath = jsonPath.slice(2);
			}

			let keybindingNode: Node | undefined;
			if (patchMatches(['*', 'args', '*'])) {
				keybindingNode = node.parent!.parent!.parent!;
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

			const commandTitles = Object.fromEntries((await getAllCommandPaletteCommands().catch(() => []))
				.map(({ command, title }) => [command, title]));
			const commandsList = await getAllVscodeCommands();
			const startPosition = document.positionAt(node.offset + 1);
			const endPosition = document.positionAt(node.offset + 1 + node.length - 2);
			const range = new Range(startPosition, endPosition);

			return commandsList.map((command, i) => ({
				label: command,
				kind: CompletionItemKind.Constant,
				detail: commandTitles[command],
				range,
				// ensure builtin commands showed earlier
				sortText: i.toString().padStart(5, '0'),
			}));
		},
	});
}
