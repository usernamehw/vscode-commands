import { Uri, workspace, type ExtensionContext } from 'vscode';
import { vscodeUtils } from '../utils/vscodeUtils';

/**
 * Reference it in schema files like: `commandsExtension://schemas/codicons`
 */
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
					} else if (uri.path === '/colors') {
						const allColors = await getAllWorkbenchColors();

						const schema = {
							type: 'string',
							enum: allColors.map(arr => arr[0]),
							enumDescriptions: allColors.map(arr => arr[1]),
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
		allCodiconsNames.sort((a, b) => a.localeCompare(b));
		return allCodiconsNames;
	} catch (e) {
		vscodeUtils.showErrorNotification(e);
		return [];
	}
}

async function getAllWorkbenchColors(): Promise<string[][]> {
	const document = await workspace.openTextDocument(Uri.parse('vscode://schemas/workbench-colors'));
	const documentText = document.getText();
	const allColorsWithDescriptions: string[][] = [];

	try {
		const documentObject = JSON.parse(documentText) as { properties: Record<string, { description: string }> };
		const allColorNames: string[] = Object.keys(documentObject?.properties);
		for (const color of allColorNames) {
			allColorsWithDescriptions.push([
				color,
				documentObject.properties?.[color]?.description,
			]);
		}
		return allColorsWithDescriptions;
	} catch (e) {
		vscodeUtils.showErrorNotification(e);
		return [];
	}
}
