import { MarkdownString, Uri } from 'vscode';
import { TopLevelCommands } from './types';


export function createFolderHoverText(nestedItems: TopLevelCommands) {
	const markdown = new MarkdownString(undefined, true);
	markdown.isTrusted = true;
	for (const key in nestedItems) {
		const item = nestedItems[key];
		const commandArg = item.args ? `?${encodeURIComponent(JSON.stringify(item.args))}` : '';
		const commandUri = Uri.parse(
			`command:${item.command}${commandArg}`,
		);
		markdown.appendMarkdown(`[${key}](${commandUri})\n\n`);
	}
	return markdown;
}
