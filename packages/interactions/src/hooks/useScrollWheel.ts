import type { ScrollEvents } from '@sv-types/shared';
import { onMount } from 'svelte';

export const docs = {
	props: {
		scrollWheelProps: {
			description:
				'Props for useScrollWheel hook, includes event handlers',
			type: 'ScrollWheelProps',
			required: false,
			default: '{}',
		},
	},
	returns: {
		scrollWheelProps: {
			description: 'Props to spread onto the target element',
			type: 'DOMAttributes<T>',
		},
	},
	events: {
		onScroll: {
			description: 'Handler that is called when a scroll event occurs',
			type: '(e: ScrollEvent) => void',
		},
	},
};

export interface ScrollWheelProps extends ScrollEvents {
	/** Whether the scroll listener should be disabled. */
	isDisabled?: boolean;
}

// scroll wheel needs to be added not passively so it's cancelable, small helper hook to remember that
export const useScrollWheel = (
	props: ScrollWheelProps = {},
	ref?: HTMLElement | null,
): void => {
	const { onScroll, isDisabled } = props;

	const onScrollHandler = (e: WheelEvent) => {
		if (e.ctrlKey) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		if (onScroll) {
			onScroll({ deltaX: e.deltaX, deltaY: e.deltaY });
		}
	};

	if (isDisabled || !ref) {
		return;
	}

	ref.addEventListener('wheel', onScrollHandler);

	onMount(() => {
		return () => {
			ref.removeEventListener('wheel', onScrollHandler);
		};
	});
};
