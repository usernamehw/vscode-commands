import { languages, window } from 'vscode';

export async function setEditorLanguageCommand(languageId: string) {
	if (typeof languageId !== 'string') {
		window.showErrorMessage('Argument is not a string.');
		return;
	}
	if (!window.activeTextEditor) {
		return;
	}
	await languages.setTextDocumentLanguage(window.activeTextEditor.document, languageId);
}
