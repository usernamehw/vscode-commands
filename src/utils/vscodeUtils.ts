import { commands, env, Range, Selection, TextEditorRevealType, UIKind, Uri, window, type DocumentSymbol, type TextDocument, type TextEditor } from 'vscode';
import { sleep } from './utils';

/**
 * Return all registered vscode commands (excluding internal).
 */
export async function getAllVscodeCommands(): Promise<string[]> {
	return commands.getCommands(true);
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
export async function openSettingsJson(target: 'global' | 'workspace'): Promise<void> {
	await commands.executeCommand(target === 'global' ? 'workbench.action.openSettingsJson' : 'workbench.action.openWorkspaceSettingsFile');
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
		// eslint-disable-next-line no-param-reassign
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

export function stringToUint8Array(text: string): Uint8Array {
	// @ts-expect-error TextEncoder EXISTS
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	return new TextEncoder().encode(text);
}
export function uint8ArrayToString(arr: Uint8Array): string {
	// @ts-expect-error TextDecoder EXISTS
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	return new TextDecoder().decode(arr);
}
/**
 * Return `true` when on the web.
 */
export function isOnWeb(): boolean {
	return env.uiKind === UIKind.Web;
}

export function showErrorNotification(e: unknown): void {
	window.showErrorMessage((e as Error).message);
}

export function showNotOnWebNotification(text: string): void {
	window.showWarningMessage(`Not on the web, you don't. "${text}"`);
}

export function createCommandUri(commandId: string, args?: unknown): Uri {
	const commandArg = args ? `?${encodeURIComponent(JSON.stringify(args))}` : '';
	return Uri.parse(`command:${commandId}${commandArg}`);
}