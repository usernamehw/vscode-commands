import { env, languages, Range, Uri, window, type Disposable, type DocumentLink } from 'vscode';
import { $config, Constants } from './extension';
import { run } from './run';

const documentLinkDisposables: Disposable[] = [];

export function updateDocumentLinkProvider(): void {
	disposeDocumentLinkDisposables();

	if (!$config.documentLinksEnabled) {
		return;
	}

	const uriDisposable = window.registerUriHandler({
		handleUri(uri) {
			let args: unknown;
			try {
				args = JSON.parse(uri.fragment) as unknown;
			} catch (e) {
				window.showErrorMessage(`Invalid JSON: \`${uri.fragment}\` Document link args must be a valid json string.`);
			}
			run({
				command: uri.query,
				args,
			});
		},
	});

	const regex = /@(?<command>[a-z\d._-]+)(?:\?(?<args>[^@]+))?@/igu;

	const documentLinkProviderDisposable = languages.registerDocumentLinkProvider(
		{
			scheme: 'file',
			pattern: $config.documentLinksPattern || undefined,
		},
		{
			provideDocumentLinks(document) {
				const matches: DocumentLink[] = [];
				for (let i = 0; i < document.lineCount; i++) {
					const text = document.lineAt(i).text;
					for (let match = regex.exec(text); match !== null; match = regex.exec(text)) {
						matches.push({
							range: new Range(i, match.index, i, match[0].length + match.index),
							target: Uri.from({
								scheme: env.uriScheme,
								authority: Constants.ExtensionId,
								query: match.groups?.command,
								fragment: match.groups?.args,
							}),
							tooltip: 'Custom command.',
						});
					}
				}
				return matches;
			},
		},
	);
	documentLinkDisposables.push(uriDisposable, documentLinkProviderDisposable);
}

function disposeDocumentLinkDisposables(): void {
	for (const disposable of documentLinkDisposables) {
		disposable.dispose();
	}
	documentLinkDisposables.length = 0;
}
