
/**
 * Emulate delay with async setTimeout().
 */
const sleep = async (ms: number): Promise<void> => new Promise(resolve => {
	setTimeout(resolve, ms);
});
/**
 * Return `true` when item is an object (NOT Array, NOT null)
 */
function isSimpleObject(item: unknown): item is Record<string, unknown> {
	if (Array.isArray(item) || item === null) {
		return false;
	} else if (typeof item === 'object') {
		return true;
	}
	return false;
}
/**
 * Unique id... Ehh, good enough.
 */
function uniqueId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
/**
 * Copy object or array (hopefully without circular references).
 */
function deepCopy<T>(object: T): T {
	return JSON.parse(JSON.stringify(object)) as T;
}

/**
 * True when not `undefined` and not `null`.
 */
function nonNullable<T>(value: T): value is NonNullable<T> {
	return value !== undefined &&
		value !== null;
}
/**
 * Keep only unique items (for primitives).
 */
function unique<T>(arr: T[]): T[] {
	return Array.from(new Set(arr));
}

// From https://stackoverflow.com/questions/33631041/javascript-async-await-in-replace
/**
 * Replace all matches in a string (async).
 */
async function replaceAsync(str: string, regex: RegExp, asyncFn: (match: string, ...args: string[])=> Promise<string>): Promise<string> {
	const promises: ReturnType<typeof asyncFn>[] = [];

	str.replace(regex, (match, ...args: string[]) => {
		const promise = asyncFn(match, ...args);
		promises.push(promise);
		return '';// doesn't matter, str not modified here
	});

	const data = await Promise.all(promises);

	return str.replace(regex, () => data.shift()!);
}

export const utils = {
	sleep,
	isSimpleObject,
	uniqueId,
	deepCopy,
	nonNullable,
	unique,
	replaceAsync,
};
