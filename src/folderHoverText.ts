import { MarkdownString, Uri } from 'vscode';
import { type CommandFolder } from './types';
import { getAllNestedCommands } from './utils';

/**
 * Create tooltip content for folder that contains all of the nested items.
 */
export function createFolderHoverText(folder: CommandFolder): MarkdownString {
	const markdown = new MarkdownString(undefined, true);
	markdown.isTrusted = true;
	const allNestedCommands = getAllNestedCommands(folder);

	for (const key in allNestedCommands) {
		const item = allNestedCommands[key];
		const commandArg = item.args ? `?${encodeURIComponent(JSON.stringify(item.args))}` : '';
		const commandUri = Uri.parse(
			`command:${item.command}${commandArg}`,
		);
		markdown.appendMarkdown(`[${key}](${commandUri.toString()})\n\n`);
	}

	return markdown;
}
