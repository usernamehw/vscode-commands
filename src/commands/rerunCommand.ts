import { $state } from '../extension';
import { run } from '../run';

export async function rerunCommand(): Promise<void> {
	await run($state.lastExecutedCommand);
}
