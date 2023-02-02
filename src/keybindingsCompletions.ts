import { commands, CompletionItemKind, languages, Range } from 'vscode';
import { findNodeAtOffset, getNodePath, getNodeValue, Node, parseTree } from 'jsonc-parser';
import { getAllCommandPaletteCommands } from './quickPick';

export default () => {
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

			let path = getNodePath(node);
			const patchMatches = (compare: string[], useStartsWith = false) => {
				if (!useStartsWith && compare.length !== path.length) {
					return undefined;
				}
				return compare.every((item, i) => item === '*' || item === path[i]);
			};

			if (languages.match({ pattern: '**/package.json' }, document)) {
				if (!patchMatches(['contributes', 'keybindings'], true)) {
					return;
				}
				path = path.slice(2);
			}
			let keybindingNode: Node | undefined;
			if (patchMatches(['*', 'args', '*'])) {
				keybindingNode = node.parent!.parent!.parent!;
			} else if (patchMatches(['*', 'args', '*', 'command'])) {
				keybindingNode = node.parent!.parent!.parent!.parent!.parent!;
			}
			if (!keybindingNode) {
				return;
			}

			const keybinding = getNodeValue(keybindingNode);
			if (keybinding.command !== 'commands.run') {
				return;
			}

			const commandTitles = Object.fromEntries((await getAllCommandPaletteCommands().catch(() => [])).map(({ command, title }) => [command, title]));
			const commandsList = await commands.getCommands(true);

			const start = document.positionAt(node.offset + 1);
			const end = document.positionAt(node.offset + 1 + node.length - 2);
			const range = new Range(start, end);
			// eslint-disable-next-line consistent-return
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
};
