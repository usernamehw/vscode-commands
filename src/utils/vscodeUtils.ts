import { commands, env, languages, Range, Selection, TextEditorRevealType, UIKind, Uri, window, workspace, type DocumentSymbol, type TextDocument, type TextEditor } from 'vscode';
import { utils } from './utils';

/**
 * Return all registered vscode commands (excluding internal).
 */
async function getAllVscodeCommands(): Promise<string[]> {
	return commands.getCommands(true);
}
/**
 * Open vscode Settings GUI with input value set to the specified value.
 */
async function openSettingGuiAt(settingName: string): Promise<void> {
	await commands.executeCommand('workbench.action.openSettings', settingName);
}
/**
 * Open vscode Keybindings GUI with input value set to the specified value.
 */
async function openKeybindingsGuiAt(value: string): Promise<void> {
	await commands.executeCommand('workbench.action.openGlobalKeybindings', value);
}
/**
 * Open global or workspace settings.json file in the editor.
 */
async function openSettingsJson(target: 'global' | 'workspace'): Promise<void> {
	await commands.executeCommand(target === 'global' ? 'workbench.action.openApplicationSettingsJson' : 'workbench.action.openWorkspaceSettingsFile');
}
/**
 * Get all symbols for active document.
 */
async function getSymbols(document: TextDocument): Promise<DocumentSymbol[]> {
	let symbols = await commands.executeCommand<DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', document.uri);
	if (!symbols || symbols.length === 0) {
		await utils.sleep(500);
		symbols = await commands.executeCommand<DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', document.uri);
	}
	if (!symbols || symbols.length === 0) {
		await utils.sleep(1000);
		symbols = await commands.executeCommand<DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', document.uri);
	}
	if (!symbols || symbols.length === 0) {
		await utils.sleep(2000);
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
async function goToSymbol(editor: TextEditor | undefined, symbolName: string): Promise<void> {
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
function forEachSymbol(f: (symbol: DocumentSymbol)=> void, symbols: DocumentSymbol[]): void {
	for (const symbol of symbols) {
		f(symbol);
		if (symbol.children.length) {
			forEachSymbol(f, symbol.children);
		}
	}
}
async function readFileVscode(pathOrUri: Uri | string): Promise<string> {
	try {
		const uri = typeof pathOrUri === 'string' ? Uri.file(pathOrUri) : pathOrUri;
		const file = await workspace.fs.readFile(uri);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		return new TextDecoder().decode(file);
	} catch (e) {
		window.showErrorMessage((e as Error).message);
		return '';
	}
}
async function writeFileVscode(pathOrUri: Uri | string, content: string): Promise<void> {
	try {
		const uri = typeof pathOrUri === 'string' ? Uri.file(pathOrUri) : pathOrUri;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const encodedContent: Uint8Array = new TextEncoder().encode(content);
		await workspace.fs.writeFile(uri, encodedContent);
	} catch (e) {
		window.showErrorMessage((e as Error).message);
	}
}
/**
 * Return `true` when on the web.
 */
function isOnWeb(): boolean {
	return env.uiKind === UIKind.Web;
}

function showErrorNotification(e: unknown): void {
	window.showErrorMessage((e as Error).message);
}

function showNotOnWebNotification(text: string): void {
	window.showWarningMessage(`Not on the web, you don't. "${text}"`);
}
/**
 * Create [Command URI](https://code.visualstudio.com/api/extension-guides/command#command-uris)
 */
function createCommandUri(commandId: string, args?: unknown): Uri {
	const commandArg = args ? `?${encodeURIComponent(JSON.stringify(args))}` : '';
	return Uri.parse(`command:${commandId}${commandArg}`);
}
function getSelectedLineNumbers(editor: TextEditor): number[] {
	const lineNumbers = new Set<number>();
	for (const selection of editor.selections) {
		for (let i = selection.start.line; i <= selection.end.line; i++) {
			lineNumbers.add(i);
		}
	}
	return Array.from(lineNumbers);
}
/** VSCode span accepts only #fff #fff0 #fffff #ffffff00 var(--vscode...) color formats. */
type ColorFormat = `#${string}` | `var(--vscode-${string}`;
/**
 * Create a styled span to use in MarkdownString.
 *
 * `editorError.foreground` => `--vscode-editorError-foreground`
 */
function createStyledMarkdown({
	strMd = '',
	backgroundColor = 'var(--vscode-editorHoverWidget-background)',
	color = 'var(--vscode-editorHoverWidget-foreground)',
}: {
	strMd?: string;
	backgroundColor?: ColorFormat;
	color?: string;
}): string {
	const colorStyle = color ? `color:${color};` : '';
	const backgroundStyle = backgroundColor ? `background-color:${backgroundColor};` : '';
	return `<span style="${colorStyle}${backgroundStyle}">${strMd}</span>`;
}

async function openInUntitled(content: string, language?: string): Promise<TextEditor> {
	const document = await workspace.openTextDocument({
		language,
		content,
	});
	return window.showTextDocument(document);
}
/**
 * `true` when editor matches [Glob](https://code.visualstudio.com/api/references/vscode-api#GlobPattern).
 */
function editorMatchesGlob(editor: TextEditor, glob: string): boolean {
	return languages.match({
		pattern: glob,
	}, editor.document) !== 0;
}
/**
 * `true` when editor language id matches [Language Id](https://code.visualstudio.com/docs/languages/identifiers).
 */
function editorLanguageIdMatches(editor: TextEditor, languageId: string): boolean {
	const languagesAsArray = languageId
		.split(',')
		.map(lang => lang.trim());
	return languagesAsArray.includes(editor.document.languageId);
}

export const vscodeUtils = {
	getAllVscodeCommands,
	openSettingGuiAt,
	openKeybindingsGuiAt,
	openSettingsJson,
	goToSymbol,
	isOnWeb,
	showErrorNotification,
	showNotOnWebNotification,
	createCommandUri,
	readFileVscode,
	writeFileVscode,
	getSelectedLineNumbers,
	createStyledMarkdown,
	openInUntitled,
	editorMatchesGlob,
	editorLanguageIdMatches,
};
