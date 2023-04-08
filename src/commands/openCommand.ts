import { utils } from '../utils/utils';
import { vscodeUtils } from '../utils/vscodeUtils';

export async function openCommand(arg: string | { target: string; app: string; arguments?: string[] }): Promise<void> {
	if (vscodeUtils.isOnWeb()) {
		vscodeUtils.showNotOnWebNotification('Running "commands.open"');
		return;
	}
	const open = (await import('open')).default;
	if (typeof arg === 'string') {
		await open(arg);
	} else if (utils.isSimpleObject(arg)) {
		await open(arg.target, {
			app: {
				name: arg.app,
				arguments: arg.arguments ?? [],
			},
		});
	}
}
