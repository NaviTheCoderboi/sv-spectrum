import { onMount } from 'svelte';
import type { Context } from 'svelte-contextify';

/**
 * Syncs ref from context with ref passed to hook
 * @param context - Context to sync ref with
 * @param ref - Ref to sync with context
 */
export const useSyncRef = <
	T,
	F extends {
		ref?: T | null;
	} | null,
>(
	context?: Context<F>,
	ref?: T | null,
) => {
	onMount(() => {
		if (context?.get()?.ref && ref) {
			context.set({
				...context.get(),
				ref,
			});
			return () => {
				if (context.get()?.ref) {
					context.set({
						...context.get(),
						ref: null,
					});
				}
			};
		}
	});
};
