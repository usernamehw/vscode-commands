
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

export const utils = {
	sleep,
	isSimpleObject,
	uniqueId,
	deepCopy,
	nonNullable,
};
