import { window } from 'vscode';

export function showStatusBarNotificationCommand(arg: StatusBarNotification | string): void {
	if (typeof arg === 'string') {
		showTempStatusBarMessage({
			message: arg,
		});
	} else {
		showTempStatusBarMessage(arg);
	}
}

function showTempStatusBarMessage(notification: StatusBarNotification): void {
	const tempStatusBarMessage = window.createStatusBarItem();
	tempStatusBarMessage.text = notification.message;
	tempStatusBarMessage.color = notification.color;

	tempStatusBarMessage.show();
	setTimeout(() => {
		tempStatusBarMessage.hide();
		tempStatusBarMessage.dispose();
	}, notification.timeout ?? 5000);
}

interface StatusBarNotification {
	message: string;
	color?: string;
	timeout?: number;
	// TODO: allow to specify priority/alignment?
}
