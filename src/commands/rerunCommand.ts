import { $state } from '../extension';
import { run } from '../run';

export async function rerunCommand() {
	await run($state.lastExecutedCommand);
}
