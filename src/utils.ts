import vscode, { commands, DocumentSymbol, Selection, TextDocument, TextEditor } from 'vscode';
import { TopLevelCommands } from './types';

export const sleep = async (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
/**
 * Return `true` when item is an object (NOT Array, NOT null)
 */
export function isSimpleObject(item: unknown): item is AnyObject {
	if (Array.isArray(item)) {
		return false;
	} else if (item === null) {
		return false;
	} else if (typeof item === 'object') {
		return true;
	}
	return false;
}

interface AnyObject {
	[key: string]: unknown;
}

/**
 * Open vscode Settings GUI with input value set to the specified value.
 */
export function openSettingGuiAt(settingName: string) {
	vscode.commands.executeCommand('workbench.action.openSettings', settingName);
}
/**
 * Open vscode Keybindings GUI with input value set to the specified value.
 */
export function openKeybindingsGuiAt(value: string) {
	vscode.commands.executeCommand('workbench.action.openGlobalKeybindings', value);
}
/**
 * Walk recursively over all items and execute callback for each item/command.
 */
export function forEachItem(f: (item: TopLevelCommands['anykey'], key: string)=> void, items: TopLevelCommands) {
	for (const key in items) {
		const item = items[key];
		f(item, key);
		if (item.nestedItems) {
			forEachItem(f, item.nestedItems);
		}
	}
}

async function getSymbols(document: TextDocument): Promise<DocumentSymbol[]> {
	let symbols = await commands.executeCommand<DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', document.uri);
	if (!symbols || symbols.length === 0) {
		await sleep(1200);
		symbols = await commands.executeCommand<DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', document.uri);
	}
	if (!symbols || symbols.length === 0) {
		await sleep(2000);
		symbols = await commands.executeCommand<DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', document.uri);
	}
	return symbols || [];
}

export async function goToSymbol(editor: TextEditor, symbolName: string) {
	const symbols = await getSymbols(editor.document);

	let foundSymbol: DocumentSymbol | undefined;
	forEachSymbol(symbol => {
		if (symbol.name === symbolName) {
			foundSymbol = symbol;
		}
	}, symbols);

	if (foundSymbol) {
		editor.selection = new Selection(foundSymbol.range.start, foundSymbol.range.start);
		editor.revealRange(foundSymbol.range, vscode.TextEditorRevealType.AtTop);
	}
}

export function forEachSymbol(f: (symbol: DocumentSymbol)=> void, symbols: DocumentSymbol[]) {
	for (const symbol of symbols) {
		f(symbol);
		if (symbol.children.length) {
			forEachSymbol(f, symbol.children);
		}
	}
}
