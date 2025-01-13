import throttle from 'lodash/throttle';
import { commands, Disposable, MarkdownString, StatusBarAlignment, StatusBarItem, Terminal, ThemeColor, ThemeIcon, window, workspace } from 'vscode';
import { CommandId } from '../commands';
import { $config, Constants } from '../extension';
import { vscodeUtils } from '../utils/vscodeUtils';

let isWatchRunning = false;

let statusBarItem: StatusBarItem;
const errorBackgroundColor = new ThemeColor('statusBarItem.errorBackground');
const warningBackgroundColor = new ThemeColor('statusBarItem.warningBackground');
const terminalDisposables: Disposable[] = [];

export function initTerminalIndicatorStatusBar(): void {
	isWatchRunning = false;
	disposeAllTerminalDisposables();
	statusBarItem?.hide();
	statusBarItem?.dispose();

	if (!$config.watchTerminalStatusBar.enabled) {
		return;
	}

	if (!workspace.getConfiguration('terminal.integrated.shellIntegration').get('enabled')) {
		window.showErrorMessage('Setting "terminal.integrated.shellIntegration.enabled" is disabled. It\'s required for "commands.watchTerminalStatusBar" feature to work.');
		return;
	}

	terminalDisposables.push(window.registerTerminalProfileProvider('commands.watch', {
		// Doesn't do anything?
		provideTerminalProfile(_token) {
			return {
				options: {
					name: Constants.ExtensionTerminalProfileTitle,
				},
			};
		},
	}));

	terminalDisposables.push(window.onDidChangeTerminalShellIntegration(e => {
		if (e.terminal.name === Constants.ExtensionTerminalProfileTitle && e.shellIntegration) {
			startUpdatingStatusBar();
		}
	}));

	terminalDisposables.push(window.onDidStartTerminalShellExecution(e => {
		if (e.terminal.name === Constants.ExtensionTerminalProfileTitle) {
			startUpdatingStatusBar();
		}
	}));

	terminalDisposables.push(window.onDidCloseTerminal(terminal => {
		if (terminal.name === Constants.ExtensionTerminalProfileTitle) {
			theEnd();
		}
	}));

	terminalDisposables.push(window.onDidEndTerminalShellExecution(e => {
		if (e.terminal.name === Constants.ExtensionTerminalProfileTitle) {
			theEnd();
		}
	}));

	// Old/restored terminals don't get shellIntegration? kill them idk
	killTargetTerminalIfExists();

	const alignment = $config.watchTerminalStatusBar.alignment === 'right' ? StatusBarAlignment.Right : StatusBarAlignment.Left;
	const priority = $config.watchTerminalStatusBar.priority ?? -100_000;
	statusBarItem = window.createStatusBarItem(alignment, priority);
	statusBarItem.text = $config.watchTerminalStatusBar.defaultText;
	statusBarItem.command = CommandId.WatchTerminalStatusBarOnClickCommand;
	statusBarItem.show();
}

function getTargetTerminal(): Terminal {
	for (const terminal of window.terminals) {
		if (terminal.name === Constants.ExtensionTerminalProfileTitle) {
			return terminal;
		}
	}

	window.showErrorMessage(`Cannot find terminal ${Constants.ExtensionTerminalProfileTitle}`);
	throw new Error(`Cannot find terminal ${Constants.ExtensionTerminalProfileTitle}`);
}
function isNoTargetTerminal(): boolean {
	return window.terminals.find(term => term.name === Constants.ExtensionTerminalProfileTitle) === undefined;
}

function theEnd(): void {
	isWatchRunning = false;
	statusBarItem.tooltip = '';
	setStatusBarStatusDefault();
}

export function startWatchTerminal(): void {
	if (!$config.watchTerminalStatusBar.enabled) {
		window.showErrorMessage('`commands.watchTerminalStatusBar` setting not enabled.');
		return;
	}

	if (isNoTargetTerminal()) {
		// create terminal will trigger `onDidChangeTerminalShellIntegration` which will trigger `startUpdatingStatusBar`
		createTerminalIfDoesntExist();
	} else {
		startUpdatingStatusBar();
	}
}

function killTargetTerminalIfExists(): void {
	window.terminals.find(term => term.name === Constants.ExtensionTerminalProfileTitle)?.dispose();
}

function createTerminalIfDoesntExist(): void {
	if (window.terminals.find(terminal => terminal.name === Constants.ExtensionTerminalProfileTitle)) {
		return;
	}

	const terminal = window.createTerminal({
		name: Constants.ExtensionTerminalProfileTitle,
		iconPath: $config.watchTerminalStatusBar.terminalIcon ? new ThemeIcon($config.watchTerminalStatusBar.terminalIcon) : undefined,
		color: $config.watchTerminalStatusBar.terminalIconColor ? new ThemeColor($config.watchTerminalStatusBar.terminalIconColor) : undefined,
	});

	if ($config.watchTerminalStatusBar.showTerminal) {
		terminal.show();
	}

	terminalDisposables.push(terminal);
}

async function startUpdatingStatusBar(): Promise<void> {
	const terminal = getTargetTerminal();

	if (terminal.shellIntegration === undefined) {
		window.showErrorMessage(`"shellIntegration" is "undefined". Maybe manual installation needed https://code.visualstudio.com/docs/terminal/shell-integration#_manual-installation`);
		return;
	}

	isWatchRunning = true;

	const command = terminal.shellIntegration.executeCommand($config.watchTerminalStatusBar.sendText);
	const stream = command.read();
	for await (const data of stream) {
		updateTerminalIndicatorThrottled(data);
	}
}

const updateTerminalIndicatorThrottled = throttle(updateTerminalIndicatorStatusBar, 200, {
	leading: false,
	trailing: true,
});

function updateTerminalIndicatorStatusBar(data: string): void {
	let hasErrors = false;
	let hasWarnings = false;
	let hasSuccess = false;

	for (const errorWhen of $config.watchTerminalStatusBar.errorWhen) {
		if (data.includes(errorWhen)) {
			hasErrors = true;
			break;
		}
	}
	for (const warningWhen of $config.watchTerminalStatusBar.warningWhen) {
		if (data.includes(warningWhen)) {
			hasWarnings = true;
			break;
		}
	}

	for (const successWhen of $config.watchTerminalStatusBar.successWhen) {
		if (data.includes(successWhen)) {
			hasSuccess = true;
			break;
		}
	}

	if (hasErrors) {
		// Matched with user setting `errorWhen`
		setStatusBarStatusError();
	} else if (hasWarnings) {
		// Matched with user setting `warningWhen`
		setStatusBarStatusWarning();
	} else {
		// 0 Errors & 0 Warnings matches from user settings `errorWhen` / `warningWhen`
		if ($config.watchTerminalStatusBar.successWhen.length === 0) {
			// User didn't specify any conditions for success with setting `successWhen`
			setStatusBarStatusSuccess();
		} else {
			// Check if output is really a success or not
			if (hasSuccess) {
				setStatusBarStatusSuccess();
			} else {
				setStatusBarStatusDefault();// TODO: Maybe different status?
			}
		}
	}

	if ($config.watchTerminalStatusBar.tooltipEnabled) {
		statusBarItem.tooltip = prepareTerminalHover(data);
	}
}

function setStatusBarStatusDefault(): void {
	statusBarItem.text = $config.watchTerminalStatusBar.defaultText;
	statusBarItem.backgroundColor = undefined;
}
function setStatusBarStatusError(): void {
	statusBarItem.text = $config.watchTerminalStatusBar.errorText;
	statusBarItem.backgroundColor = $config.watchTerminalStatusBar.highlightErrorWithBackground ? errorBackgroundColor : undefined;
}
function setStatusBarStatusWarning(): void {
	statusBarItem.text = $config.watchTerminalStatusBar.warningText;
	statusBarItem.backgroundColor = $config.watchTerminalStatusBar.highlightWarningWithBackground ? warningBackgroundColor : undefined;
}
function setStatusBarStatusSuccess(): void {
	statusBarItem.text = $config.watchTerminalStatusBar.successText;
	statusBarItem.backgroundColor = undefined;
}

function prepareTerminalHover(message: string): MarkdownString {
	const md = new MarkdownString();
	md.isTrusted = true;
	md.supportHtml = true;
	md.appendMarkdown('[]()\n');// always hover

	for (const regexString in $config.watchTerminalStatusBar.replaceInTooltip ?? {}) {
		let replaceTarget: RegExp | string;
		const replaceText = $config.watchTerminalStatusBar.replaceInTooltip[regexString];
		const isRegexRegex = /\/(?<regex>.+?)\/(?<flag>[dgimsuvy]+)?/u.exec(regexString);

		if (isRegexRegex) {
			replaceTarget = new RegExp(isRegexRegex.groups?.regex ?? '', isRegexRegex.groups?.flag ?? 'u');
		} else {
			replaceTarget = regexString;
		}

		message = message.replace(replaceTarget, replaceText);
	}

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
	message = message.replace(/WARNING/gu, match => vscodeUtils.createStyledMarkdown({
		strMd: `${Constants.NonBreakingSpaceSymbol}${match}${Constants.NonBreakingSpaceSymbol}`,
		backgroundColor: '#ee9900',
		color: '#fafafa',
	}));

	md.appendMarkdown(message.trim());

	return md;
}
// TODO: recognize absolute/relative paths
// function getAllAbsoluteFilePaths(str: string): string[] {
// 	if (utils.isWindowsOs()) {
// 		return str.match(/[A-Z]:(\\[^\\\n]+)+\\?( \d+:(\d+)|(\d+-\d+))?/gu);
// 	} else {
// 		// return str.match(/.../g);
// 	}
// }

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
