import { MarkdownString, type Uri } from 'vscode';
import { CommandId } from './commands';
import { type CommandFolder } from './types';
import { extUtils } from './utils/extUtils';
import { vscodeUtils } from './utils/vscodeUtils';

/**
 * Create tooltip content for folder that contains all of the nested items.
 */
export function createFolderHoverText(folder: CommandFolder): MarkdownString {
	const markdown = new MarkdownString(undefined, true);
	markdown.isTrusted = true;
	const allNestedCommands = extUtils.getAllNestedCommands(folder);

	if (Object.keys(allNestedCommands).length === 0) {
		markdown.appendText('<Empty>');
		return markdown;
	}

	for (const key in allNestedCommands) {
		const item = allNestedCommands[key];

		let commandUri: Uri;
		if (typeof item === 'string') {
			commandUri = vscodeUtils.createCommandUri(item);
		} else if (item.sequence) {
			commandUri = vscodeUtils.createCommandUri(CommandId.Run, key);
		} else {
			commandUri = vscodeUtils.createCommandUri(item.command, item.args);
		}
		markdown.appendMarkdown(`[${key}](${commandUri.toString()})\n\n`);
	}

	return markdown;
}
