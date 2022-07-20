import { window } from 'vscode';
import { StatusBarNotification } from '../types';

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
