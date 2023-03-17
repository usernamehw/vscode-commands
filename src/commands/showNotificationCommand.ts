import { window } from 'vscode';

interface NotificationArgs {
	message: string;
	severity?: 'error' | 'info' | 'warning';
}

export function showNotificationCommand(arg: NotificationArgs | string): void {
	if (typeof arg === 'string') {
		window.showInformationMessage(arg);
	} else if (arg.severity === 'error') {
		window.showErrorMessage(arg.message);
	} else if (arg.severity === 'warning') {
		window.showWarningMessage(arg.message);
	} else {
		window.showInformationMessage(arg.message);
	}
}
