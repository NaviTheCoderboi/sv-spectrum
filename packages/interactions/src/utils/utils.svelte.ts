import type { FocusableElement, SFocusEvent } from '@sv-types/shared';
import { onMount } from 'svelte';

export const useBlurEvent = <
	T extends FocusableElement = FocusableElement,
	R extends HTMLElement = HTMLElement,
>(
	onBlur: (e: SFocusEvent<T, R>) => void,
) => {
	const stateRef = $state({
		isFocused: false,
		observer: null as null | MutationObserver,
	});

	onMount(() => {
		return () => {
			if (stateRef.observer) {
				stateRef.observer.disconnect();
				stateRef.observer = null;
			}
		};
	});

	return {
		isFocused: () => stateRef.isFocused,
		handler: (e: SFocusEvent<T, R>) => {
			if (
				e.target instanceof HTMLButtonElement ||
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				e.target instanceof HTMLSelectElement
			) {
				stateRef.isFocused = true;

				const target = e.target;

				const onBlurHandler: EventListenerOrEventListenerObject | null =
					(e) => {
						stateRef.isFocused = false;

						if (target.disabled) {
							onBlur(
								new FocusEvent(
									'blur',
									e as FocusEvent,
								) as SFocusEvent<T, R>,
							);
						}

						if (stateRef.observer) {
							stateRef.observer.disconnect();
							stateRef.observer = null;
						}
					};

				target.addEventListener('focusout', onBlurHandler, {
					once: true,
				});

				stateRef.observer = new MutationObserver(() => {
					if (stateRef.isFocused && target.disabled) {
						stateRef.observer?.disconnect();
						const relatedTargetEl =
							target === document.activeElement
								? null
								: document.activeElement;

						target.dispatchEvent(
							new FocusEvent('blur', {
								relatedTarget: relatedTargetEl,
							}),
						);
						target.dispatchEvent(
							new FocusEvent('focusout', {
								bubbles: true,
								relatedTarget: relatedTargetEl,
							}),
						);
					}
				});

				stateRef.observer.observe(target, {
					attributes: true,
					attributeFilter: ['disabled'],
				});
			}
		},
	};
};
