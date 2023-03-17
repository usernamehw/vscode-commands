import { Uri, window, workspace, type ExtensionContext } from 'vscode';

const jsonSchemaProtocol = 'commandsExtension';

export function registerDynamicJsonSchema(context: ExtensionContext): void {
	context.subscriptions.push(
		workspace.registerTextDocumentContentProvider(jsonSchemaProtocol,
			{
				async provideTextDocumentContent(uri: Uri) {
					if (uri.path === '/codicons') {
						const allCodicons = await getAllCodiconNames();

						const schema = {
							type: 'string',
							enum: allCodicons,
							markdownEnumDescriptions: allCodicons.map(codicon => `$(${codicon})`),
						};

						return JSON.stringify(schema);
					}
				},
			}),
	);
}

export async function getAllCodiconNames(): Promise<string[]> {
	const document = await workspace.openTextDocument(Uri.parse('vscode://schemas/icons'));
	const documentText = document.getText();
	try {
		const documentObject = JSON.parse(documentText) as { icons: object; properties: object };
		const allCodiconsNames: string[] = Object.keys(documentObject?.properties);
		return allCodiconsNames;
	} catch (e) {
		window.showErrorMessage((e as Error).message);
		return [];
	}
}
