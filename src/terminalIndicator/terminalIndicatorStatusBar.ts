import { commands, Disposable, MarkdownString, StatusBarAlignment, StatusBarItem, Terminal, ThemeColor, window } from 'vscode';
import { CommandId } from '../commands';
import { $config, Constants } from '../extension';
import { vscodeUtils } from '../utils/vscodeUtils';

const terminalProfileName = 'Commands:Watch';// matches contributed profile in `package.json` file
let isWatchRunning = false;

let statusBarItem: StatusBarItem;
const errorBackgroundColor = new ThemeColor('statusBarItem.errorBackground');
const terminalDisposables: Disposable[] = [];

export function initTerminalIndicatorStatusBar(): void {
	isWatchRunning = false;
	disposeAllTerminalDisposables();
	statusBarItem?.hide();
	statusBarItem?.dispose();

	if (!$config.watchTerminalStatusBar.enabled) {
		return;
	}

	terminalDisposables.push(window.registerTerminalProfileProvider('commands.watch', {
		provideTerminalProfile(_token) {
			return {
				options: {
					name: terminalProfileName,
				},
			};
		},
	}));

	// terminalDisposables.push(window.onDidChangeTerminalShellIntegration(e => {}));

	terminalDisposables.push(window.onDidStartTerminalShellExecution(e => {
		if (e.terminal.name === terminalProfileName) {
			startUpdatingStatusBar();
		}
	}));

	window.onDidCloseTerminal(terminal => {
		if (terminal.name === terminalProfileName) {
			theEnd();
		}
	});

	terminalDisposables.push(window.onDidEndTerminalShellExecution(e => {
		if (e.terminal.name === terminalProfileName) {
			theEnd();
		}
	}));

	// Old/restored terminals don't get shellIntegration? kill them idk
	const terminalExisted = killTerminalIfExists();
	if (terminalExisted) {
		setTimeout(() => {
			createTerminalIfDoesntExist();
		}, 1000);
	} else {
		createTerminalIfDoesntExist();
	}

	statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -100_000);
	statusBarItem.text = $config.watchTerminalStatusBar.defaultText;
	statusBarItem.command = CommandId.WatchTerminalStatusBarOnClickCommand;
	statusBarItem.show();
}

function getTargetTerminal(): Terminal {
	for (const terminal of window.terminals) {
		if (terminal.name === terminalProfileName) {
			return terminal;
		}
	}

	window.showErrorMessage(`Cannot find terminal ${terminalProfileName}`);
	throw new Error(`Cannot find terminal ${terminalProfileName}`);
}
function isNoTargetTerminal(): boolean {
	return window.terminals.find(term => term.name === terminalProfileName) === undefined;
}

function theEnd(): void {
	isWatchRunning = false;
	statusBarItem.text = $config.watchTerminalStatusBar.defaultText;
	statusBarItem.tooltip = '';
	statusBarItem.backgroundColor = undefined;
}

export function startWatchTerminal(): void {
	if (!$config.watchTerminalStatusBar.enabled) {
		window.showErrorMessage('`commands.watchTerminalStatusBar` setting not enabled.');
		return;
	}

	if (isNoTargetTerminal()) {
		createTerminalIfDoesntExist();
		setTimeout(() => {
			// shellIntegrarion is "undefined" after terminal creation?
			startUpdatingStatusBar();
		}, 1000);
	} else {
		startUpdatingStatusBar();
	}
}

function killTerminalIfExists(): boolean {
	const terminal = window.terminals.find(term => term.name === terminalProfileName);
	if (terminal) {
		terminal.dispose();
		return true;
	}
	return false;
}

function createTerminalIfDoesntExist(): void {
	if (window.terminals.find(terminal => terminal.name === terminalProfileName)) {
		return;
	}

	terminalDisposables.push(window.createTerminal(terminalProfileName));
}

async function startUpdatingStatusBar(): Promise<void> {
	isWatchRunning = true;
	const terminal = getTargetTerminal();

	if (terminal.shellIntegration === undefined) {
		window.showErrorMessage(`"shellIntegration" is "undefined"`);
		return;
	}

	const command = terminal.shellIntegration.executeCommand($config.watchTerminalStatusBar.sendText);
	const stream = command.read();
	for await (const data of stream) {
		updateTerminalIndicatorStatusBar(data);
	}
}

export function updateTerminalIndicatorStatusBar(data: string): void {
	for (const errorWhen of $config.watchTerminalStatusBar.errorWhen) {
		if (data.includes(errorWhen)) {
			statusBarItem.text = $config.watchTerminalStatusBar.errorText;
			statusBarItem.backgroundColor = $config.watchTerminalStatusBar.highlightErrorWithBackground ? errorBackgroundColor : undefined;
			break;
		} else {
			statusBarItem.text = $config.watchTerminalStatusBar.successText;
			statusBarItem.backgroundColor = undefined;
		}
	}

	if ($config.watchTerminalStatusBar.tooltipEnabled) {
		statusBarItem.tooltip = prepareTerminalHover(data);
	}
}

function prepareTerminalHover(message: string): MarkdownString {
	const md = new MarkdownString();
	md.isTrusted = true;
	md.supportHtml = true;
	md.appendMarkdown('[]()\n');// always hover

	// remove all ansi symbols
	// https://stackoverflow.com/questions/25245716/remove-all-ansi-colors-styles-from-strings
	// eslint-disable-next-line no-control-regex
	message = message.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/gu, '');

	// fix newlines in markdown 2 of \n is one newline
	message = message.replace(/[\n\r]/gu, () => '\n\n');

	message = message.replace(/ERROR/gu, match => vscodeUtils.createStyledMarkdown({
		strMd: `${Constants.NonBreakingSpaceSymbol}${match}${Constants.NonBreakingSpaceSymbol}`,
		backgroundColor: '#d93556',
		color: '#fafafa',
	}));
	message = message.replace(/DONE/gu, match => vscodeUtils.createStyledMarkdown({
		strMd: `${Constants.NonBreakingSpaceSymbol}${match}${Constants.NonBreakingSpaceSymbol}`,
		backgroundColor: '#669900',
		color: '#fafafa',
	}));

	md.appendMarkdown(message.trim());

	return md;
}

export function terminalOnClick(): void {
	if (isWatchRunning) {
		const terminal = getTargetTerminal();
		if ($config.watchTerminalStatusBar.commandOnClickWhenRunning === 'showTerminal') {
			terminal.show();
		} else if ($config.watchTerminalStatusBar.commandOnClickWhenRunning === 'killTerminal') {
			terminal.dispose();
		} else {
			commands.executeCommand($config.watchTerminalStatusBar.commandOnClickWhenRunning);
		}
	} else {
		/** Runs this function {@link startWatchTerminal} */
		commands.executeCommand($config.watchTerminalStatusBar.commandOnClick);
	}
}

function disposeAllTerminalDisposables(): void {
	for (const disposable of terminalDisposables) {
		disposable?.dispose();
	}
	terminalDisposables.length = 0;
}
