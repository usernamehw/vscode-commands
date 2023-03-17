import { languages, window } from 'vscode';

export async function setEditorLanguageCommand(languageId: string): Promise<void> {
	if (typeof languageId !== 'string') {
		window.showErrorMessage('Argument is not a string.');
		return;
	}
	if (!window.activeTextEditor) {
		return;
	}
	await languages.setTextDocumentLanguage(window.activeTextEditor.document, languageId);
}
