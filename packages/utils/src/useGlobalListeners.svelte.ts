import { onMount } from 'svelte';

interface GlobalListeners {
	addGlobalListener: <K>(
		el: EventTarget,
		type: K extends keyof DocumentEventMap ? K : string,
		listener: K extends keyof DocumentEventMap
			? (this: Document, ev: DocumentEventMap[K]) => any
			: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions,
	) => void;
	removeGlobalListener: <K>(
		el: EventTarget,
		type: K extends keyof DocumentEventMap ? K : string,
		listener: K extends keyof DocumentEventMap
			? (this: Document, ev: DocumentEventMap[K]) => any
			: EventListenerOrEventListenerObject,
		options?: boolean | EventListenerOptions,
	) => void;
	removeAllGlobalListeners: () => void;
}

type K = keyof DocumentEventMap;

/**
 * A hook to add and remove global event listeners.
 * @returns {GlobalListeners} - An object with methods to add and remove global event listeners.
 */
export const useGlobalListeners = (): GlobalListeners => {
	const globalListeners = new Map<
		| ((this: Document, ev: DocumentEventMap[K]) => any)
		| EventListenerOrEventListenerObject,
		| {
				type: K;
				eventTarget: EventTarget;
				fn: (...args: any) => any;
				options?: boolean | AddEventListenerOptions;
		  }
		| {
				type: string;
				eventTarget: EventTarget;
				fn: (...args: any) => any;
				options?: boolean | AddEventListenerOptions;
		  }
	>();

	const addGlobalListener = (
		eventTarget: EventTarget,
		type: K,
		listener:
			| ((this: Document, ev: DocumentEventMap[K]) => any)
			| EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions,
	) => {
		const fn = (
			typeof options !== 'boolean' && options?.once
				? (...args: any) => {
						globalListeners.delete(listener);
						// @ts-expect-error - ignore to for now
						listener(...args);
					}
				: listener
		) as (...args: any) => any;

		globalListeners.set(listener, {
			type,
			eventTarget,
			fn,
			options,
		});
		eventTarget.addEventListener(type, listener, options);
	};

	const removeGlobalListener = (
		eventTarget: EventTarget,
		type: K,
		listener:
			| ((this: Document, ev: DocumentEventMap[K]) => any)
			| EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions,
	) => {
		const fn = globalListeners.get(listener)?.fn ?? listener;
		eventTarget.removeEventListener(type, fn, options);

		globalListeners.delete(listener);
	};

	const removeAllGlobalListeners = () => {
		globalListeners.forEach((value, key) => {
			removeGlobalListener(
				value.eventTarget,
				value.type as K,
				key,
				value.options,
			);
		});
	};

	onMount(() => {
		return removeAllGlobalListeners;
	});

	return {
		addGlobalListener,
		removeGlobalListener,
		removeAllGlobalListeners,
	} as GlobalListeners;
};
