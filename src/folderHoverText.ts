import { MarkdownString, type Uri } from 'vscode';
import { extUtils, vscodeUtils } from './reexport';
import { type CommandFolder } from './types';

/**
 * Create tooltip content for folder that contains all of the nested items.
 */
export function createFolderHoverText(folder: CommandFolder): MarkdownString {
	const markdown = new MarkdownString(undefined, true);
	markdown.isTrusted = true;
	const allNestedCommands = extUtils.getAllNestedCommands(folder);

	for (const key in allNestedCommands) {
		const item = allNestedCommands[key];

		let commandUri: Uri;
		if (typeof item === 'string') {
			commandUri = vscodeUtils.createCommandUri(item);
		} else {
			commandUri = vscodeUtils.createCommandUri(item.command, item.args);
		}
		markdown.appendMarkdown(`[${key}](${commandUri.toString()})\n\n`);
	}

	return markdown;
}
