import { run } from '../run';
import { type Runnable } from '../types';

export async function runCommand(runnable: Runnable): Promise<void> {
	await run(runnable);
}
