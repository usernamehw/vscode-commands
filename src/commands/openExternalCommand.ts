import { env, Uri } from 'vscode';

export async function openExternalCommand(arg: string[] | string): Promise<void> {
	if (Array.isArray(arg)) {
		const promises = [];
		for (const link of arg) {
			promises.push(env.openExternal(Uri.parse(link)));
		}
		await Promise.all(promises);
	} else if (typeof arg === 'string') {
		await env.openExternal(Uri.parse(arg));
	}
}
