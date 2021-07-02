import { Disposable, DocumentLink, env, languages, Range, Uri, window } from 'vscode';
import { Constants, extensionConfig } from './extension';
import { run } from './run';

const documentLinkDisposables: Disposable[] = [];

export function updateDocumentLinkProvider() {
	disposeDocumentLinkDisposables();

	if (!extensionConfig.documentLinksEnabled) {
		return;
	}

	const uriDisposable = window.registerUriHandler({
		handleUri(uri) {
			run({
				command: uri.query,
				args: uri.fragment,
			});
		},
	});

	const regex = /@([a-z\d._-]+)(\?([^@]+))?@/ig;

	const documentLinkProviderDisposable = languages.registerDocumentLinkProvider(
		{
			scheme: 'file',
			pattern: extensionConfig.documentLinksPattern || undefined,
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
								authority: Constants.extensionId,
								query: match[1],
								fragment: match[3],
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

function disposeDocumentLinkDisposables() {
	for (const disposable of documentLinkDisposables) {
		disposable.dispose();
	}
	documentLinkDisposables.length = 0;
}
