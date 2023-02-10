import { commands, DocumentSymbol, env, ExtensionMode, Range, Selection, TextDocument, TextEditor, TextEditorRevealType, UIKind, window } from 'vscode';
import { $state } from './extension';
import { TopLevelCommands } from './types';

/**
 * Emulate delay with async setTimeout().
 */
export const sleep = async (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
/**
 * Return `true` when item is an object (NOT Array, NOT null)
 */
export function isSimpleObject(item: unknown): item is Record<string, unknown> {
	if (Array.isArray(item) || item === null) {
		return false;
	} else if (typeof item === 'object') {
		return true;
	}
	return false;
}

/**
 * Open vscode Settings GUI with input value set to the specified value.
 */
export async function openSettingGuiAt(settingName: string): Promise<void> {
	await commands.executeCommand('workbench.action.openSettings', settingName);
}
/**
 * Open vscode Keybindings GUI with input value set to the specified value.
 */
export async function openKeybindingsGuiAt(value: string): Promise<void> {
	await commands.executeCommand('workbench.action.openGlobalKeybindings', value);
}
/**
 * Open global or workspace settings.json file in the editor.
 */
export async function openSettingsJSON(target: 'global' | 'workspace'): Promise<void> {
	await commands.executeCommand(target === 'global' ? 'workbench.action.openSettingsJson' : 'workbench.action.openWorkspaceSettingsFile');
}
/**
 * Walk over all items (only 1 lvl nesting) from
 * `commands.commands` setting and execute callback for each item/command.
 */
export function forEachCommand(
	callback: (item: TopLevelCommands['anykey'], key: string, parentElement: TopLevelCommands)=> void,
	items: TopLevelCommands,
): void {
	for (const [key, item] of Object.entries(items)) {
		callback(item, key, items);

		if (item.nestedItems) {
			for (const [nestedKey, nestedItem] of Object.entries(item.nestedItems) || []) {
				callback(nestedItem, nestedKey, item.nestedItems);
			}
		}
	}
}
/**
 * Get all symbols for active document.
 */
async function getSymbols(document: TextDocument): Promise<DocumentSymbol[]> {
	let symbols = await commands.executeCommand<DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', document.uri);
	if (!symbols || symbols.length === 0) {
		await sleep(700);
		symbols = await commands.executeCommand<DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', document.uri);
	}
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
/**
 * Reveal symbol in editor.
 *
 * - Briefly highlight the entire line
 * - Move cursor to the symbol position
 */
export async function goToSymbol(editor: TextEditor | undefined, symbolName: string): Promise<void> {
	if (!editor) {
		window.showErrorMessage('No TextEditor provided.');
		return;
	}
	const symbols = await getSymbols(editor.document);

	let foundSymbol: DocumentSymbol | undefined;
	forEachSymbol(symbol => {
		if (symbol.name === symbolName) {
			foundSymbol = symbol;
		}
	}, symbols);

	if (foundSymbol) {
		editor.selection = new Selection(foundSymbol.range.start, foundSymbol.range.start);
		editor.revealRange(foundSymbol.range, TextEditorRevealType.AtTop);
		// Highlight for a short time revealed range
		const range = new Range(foundSymbol.range.start.line, 0, foundSymbol.range.start.line, 0);
		const lineHighlightDecorationType = window.createTextEditorDecorationType({
			backgroundColor: '#ffb12938',
			isWholeLine: true,
		});
		editor.setDecorations(lineHighlightDecorationType, [range]);
		setTimeout(() => {
			editor.setDecorations(lineHighlightDecorationType, []);
		}, 700);
	}
}
/**
 * Recursively walk through document symbols.
 */
export function forEachSymbol(f: (symbol: DocumentSymbol)=> void, symbols: DocumentSymbol[]): void {
	for (const symbol of symbols) {
		f(symbol);
		if (symbol.children.length) {
			forEachSymbol(f, symbol.children);
		}
	}
}
/**
 * Return all registered vscode commands (excluding internal).
 */
export async function getAllVscodeCommands(): Promise<string[]> {
	return await commands.getCommands(true);
}
/**
 * Unique id... Ehh, good enough.
 */
export function uniqueId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
/**
 * Copy object or array (hopefully without circular references).
 */
export function deepCopy<T>(object: T): T {
	return JSON.parse(JSON.stringify(object));
}
export function stringToUint8Array(text: string): Uint8Array {
	return new TextEncoder().encode(text);
}
export function uint8ArrayToString(arr: Uint8Array): string {
	return new TextDecoder().decode(arr);
}

export function isOnWeb(): boolean {
	return env.uiKind === UIKind.Web || $state.context.extensionMode === ExtensionMode.Development;
}

export function showNotOnWebNotification(text: string): void {
	window.showWarningMessage(`Not on the web, you don't. "${text}"`);
}
