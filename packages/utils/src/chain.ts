type Equal<T, U> =
	(<V>() => V extends T ? 1 : 2) extends <V>() => V extends U ? 1 : 2
		? true
		: false;

type FuncArgs<T> = T extends (...args: infer U) => any ? U : never;

/**
 * Chain multiple functions together
 * @param first {T} - The first function to call
 * @param others {Rest} - The rest of the functions to call
 * @returns {T} The first function
 */
export const chain = <T, Rest extends [T, ...T[]]>(
	first: T,
	...others: {
		[k in keyof Rest]: Equal<Rest[k], T> extends true ? Rest[k] : never;
	}
): T => {
	return ((...args: FuncArgs<T>) => {
		for (const callback of [first, ...others]) {
			if (typeof callback === 'function') {
				callback(...args);
			}
		}
	}) as T;
};
