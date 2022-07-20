import { window } from 'vscode';

export function showStatusBarNotificationCommand(arg: StatusBarNotification | string) {
	if (typeof arg === 'string') {
		showTempStatusBarMessage({
			message: arg,
		});
	} else {
		showTempStatusBarMessage(arg);
	}
}

function showTempStatusBarMessage(notification: StatusBarNotification) {
	const tempStatusBarMessage = window.createStatusBarItem();
	// tempStatusBarMessage.backgroundColor = new ThemeColor('statusBarItem.errorBackground');
	tempStatusBarMessage.text = notification.message;
	tempStatusBarMessage.color = notification.color;

	tempStatusBarMessage.show();
	setTimeout(() => {
		tempStatusBarMessage.hide();
		tempStatusBarMessage.dispose();
	}, notification.timeout || 4000);
}

interface StatusBarNotification {
	message: string;
	color?: string;
	timeout?: number;
	priority?: number;// TODO: allow to specify priority, make default aligned to the right item
}
