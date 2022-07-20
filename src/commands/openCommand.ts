import { isSimpleObject } from '../utils';

export async function openCommand(arg: string | { target: string; app: string; arguments?: string[] }) {
	const open = (await import('open')).default;
	if (typeof arg === 'string') {
		await open(arg);
	} else if (isSimpleObject(arg)) {
		await open(arg.target, {
			app: {
				name: arg.app,
				arguments: arg.arguments || [],
			},
		});
	}
}
