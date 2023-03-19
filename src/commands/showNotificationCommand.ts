import { window, type MessageOptions } from 'vscode';
import { CommandId } from '../commands';

interface NotificationArgs {
	message: string;
	severity?: 'error' | 'info' | 'warning';
	modal?: boolean;
}

export function showNotificationCommand(arg: NotificationArgs | string): void {
	if (typeof arg === 'string') {
		window.showInformationMessage(arg);
		return;
	}

	if (!arg) {
		window.showErrorMessage(`"args" required for ${CommandId.ShowNotification} command.`);
		return;
	}

	const options: MessageOptions = {
		modal: arg.modal,
	};

	if (arg.severity === 'error') {
		window.showErrorMessage(arg.message, options);
	} else if (arg.severity === 'warning') {
		window.showWarningMessage(arg.message, options);
	} else {
		window.showInformationMessage(arg.message, options);
	}
}
