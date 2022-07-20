import { env, Uri } from 'vscode';

export async function openExternalCommand(linkText: string) {
	// TODO: check argument types
	await env.openExternal(Uri.parse(linkText));
}
