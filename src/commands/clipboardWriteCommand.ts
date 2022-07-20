import { env, window } from 'vscode';

export async function clipboardWriteCommand(text: string) {
	if (typeof text !== 'string') {
		window.showErrorMessage('Argument is not a string.');
		return;
	}
	await env.clipboard.writeText(text);
}
