import { run } from '../run';
import { Runnable } from '../types';

export async function runCommand(runnable: Runnable) {
	await run(runnable);
}
