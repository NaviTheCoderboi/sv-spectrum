/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import clsx from 'clsx';
import { chain } from './chain';
import { mergeIds } from './useId';

interface Props {
	[key: string]: any;
}

type PropsArg = Props | null | undefined;

type TupleTypes<T> = { [P in keyof T]: T[P] } extends { [key: number]: infer V }
	? NullToObject<V>
	: never;
type NullToObject<T> = T extends null | undefined ? object : T;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
	k: infer I,
) => void
	? I
	: never;

/**
 * Merges multiple props objects together. Event handlers are chained,
 * class are combined, and ids are deduplicated - different ids
 * For all other props, the last prop object overrides all previous ones.
 * @param args - Multiple sets of props to merge together.
 */
export const mergeProps = <T extends PropsArg[]>(
	...args: T
): UnionToIntersection<TupleTypes<T>> => {
	// Start with a base clone of the first argument. This is a lot faster than starting
	// with an empty object and adding properties as we go.
	const result: Props = { ...args[0] };

	for (let i = 1; i < args.length; i++) {
		const props = args[i];
		for (const key in props) {
			const a = result[key];
			const b = props[key];

			// Chain events
			if (
				typeof a === 'function' &&
				typeof b === 'function' &&
				key[0] === 'o' &&
				key[1] === 'n'
			) {
				result[key] = chain(a, b);

				// Merge classnames, sometimes classNames are empty string which eval to false, so we just need to do a type check
			} else if (
				key === 'class' &&
				typeof a === 'string' &&
				typeof b === 'string'
			) {
				result[key] = clsx(a, b);
			} else if (key === 'id' && a && b) {
				result.id = mergeIds(a as string, b as string);
				// Override others
			} else {
				result[key] = b !== undefined ? b : a;
			}
		}
	}

	return result as UnionToIntersection<TupleTypes<T>>;
};
