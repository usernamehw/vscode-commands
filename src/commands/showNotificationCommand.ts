import { window } from 'vscode';

export function showNotificationCommand(arg: string | { message: string; severity?: 'error' | 'info' | 'warning' }) {
	if (typeof arg === 'string') {
		window.showInformationMessage(arg);
	} else {
		if (arg.severity === 'error') {
			window.showErrorMessage(arg.message);
		} else if (arg.severity === 'warning') {
			window.showWarningMessage(arg.message);
		} else {
			window.showInformationMessage(arg.message);
		}
	}
}
