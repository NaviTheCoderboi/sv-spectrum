import type { DOMAttributes, HoverEvents, PointerType } from '@sv-types/shared';
import { onMount } from 'svelte';
import type { APISchema } from '@sv-aria/docs-utils';

export const docs: APISchema = {
	props: {
		hoverProps: {
			description: 'Props for useHover hook, includes event handlers',
			type: 'HoverProps<T>',
			required: false,
			default: '{}',
		},
	},
	returns: {
		isHovered: {
			description:
				'Function to check if the element is currently hovered',
			type: '() => boolean',
		},
		hoverProps: {
			description: 'Props to spread onto the target element',
			type: 'DOMAttributes<T>',
		},
	},
	events: {
		onHoverStart: {
			description:
				'Handler that is called when a hover interaction starts',
			type: '(e: HoverEvent<T>) => void',
		},
		onHoverEnd: {
			description: 'Handler that is called when a hover interaction ends',
			type: '(e: HoverEvent<T>) => void',
		},
		onHoverChange: {
			description: 'Handler that is called when the hover state changes',
			type: '(isHovering: boolean) => void',
		},
	},
	other: {
		HoverEvent: {
			type: {
				description: 'The type of hover event being fired',
				type: '"hoverstart" | "hoverend"',
			},
			target: {
				description: 'The target element of the hover event',
				type: 'EventTarget & T',
			},
			pointerType: {
				description:
					'The type of pointer that triggered the hover event',
				type: '"mouse" | "pen"',
			},
		},
	},
};

export interface HoverProps<T extends HTMLElement = HTMLElement>
	extends HoverEvents<T> {
	/** Whether the hover events should be disabled. */
	isDisabled?: boolean;
}

export interface HoverResult<T extends HTMLElement = HTMLElement> {
	/** Props to spread on the target element. */
	hoverProps: DOMAttributes<T>;
	/** Whether the element is currently hovered. */
	isHovered: () => boolean;
}

let globalIgnoreEmulatedMouseEvents = false;
let hoverCount = 0;

const setGlobalIgnoreEmulatedMouseEvents = () => {
	globalIgnoreEmulatedMouseEvents = true;

	setTimeout(() => {
		globalIgnoreEmulatedMouseEvents = false;
	}, 50);
};

const handleGlobalPointerEvent = (e: PointerEvent) => {
	if (e.pointerType === 'touch') {
		setGlobalIgnoreEmulatedMouseEvents();
	}
};

const setupGlobalTouchEvents = () => {
	if (typeof document === 'undefined') {
		return;
	}

	if (typeof PointerEvent !== 'undefined') {
		document.addEventListener('pointerup', handleGlobalPointerEvent);
	} else {
		document.addEventListener(
			'touchend',
			setGlobalIgnoreEmulatedMouseEvents,
		);
	}

	hoverCount++;
	return () => {
		hoverCount--;
		if (hoverCount > 0) {
			return;
		}

		if (typeof PointerEvent !== 'undefined') {
			document.removeEventListener('pointerup', handleGlobalPointerEvent);
		} else {
			document.removeEventListener(
				'touchend',
				setGlobalIgnoreEmulatedMouseEvents,
			);
		}
	};
};

/**
 * Handles pointer hover interactions for an element. Normalizes behavior
 * across browsers and platforms, and ignores emulated mouse events on touch devices.
 * @param props - The props for the hook.
 * @returns The result object.
 */
export const useHover = <T extends HTMLElement = HTMLElement>(
	props: HoverProps<T> = {},
): HoverResult<T> => {
	const { onHoverStart, onHoverChange, onHoverEnd, isDisabled } = props;

	let isHovered = $state(false);
	const state = $state<{
		isHovered: boolean;
		ignoreEmulatedMouseEvents: boolean;
		pointerType: PointerType;
		target: (EventTarget & T) | null;
	}>({
		isHovered: false,
		ignoreEmulatedMouseEvents: false,
		pointerType: '' as PointerType,
		target: null,
	});

	onMount(setupGlobalTouchEvents);

	const triggerHoverStart = (
		event: MouseEvent & {
			currentTarget: EventTarget & T;
		},
		pointerType: PointerType,
	) => {
		state.pointerType = pointerType;
		if (
			isDisabled ||
			pointerType === 'touch' ||
			state.isHovered ||
			!event.currentTarget.contains(event.target as Node)
		) {
			return;
		}

		state.isHovered = true;
		const target = event.currentTarget;
		state.target = target;

		if (onHoverStart) {
			onHoverStart({
				type: 'hoverstart',
				target,
				pointerType: pointerType as 'mouse' | 'pen',
			});
		}

		if (onHoverChange) {
			onHoverChange(true);
		}

		isHovered = true;
	};

	const triggerHoverEnd = (
		event: MouseEvent & {
			currentTarget: EventTarget & T;
		},
		pointerType: PointerType,
	) => {
		state.pointerType = '' as PointerType;
		state.target = null;

		if (pointerType === 'touch' || !state.isHovered) {
			return;
		}

		state.isHovered = false;
		const target = event.currentTarget;
		if (onHoverEnd) {
			onHoverEnd({
				type: 'hoverend',
				target,
				pointerType: pointerType as 'mouse' | 'pen',
			});
		}

		if (onHoverChange) {
			onHoverChange(false);
		}

		isHovered = false;
	};

	const hoverProps: DOMAttributes<T> = {};

	if (typeof PointerEvent !== 'undefined') {
		hoverProps.onpointerenter = (e) => {
			if (globalIgnoreEmulatedMouseEvents && e.pointerType === 'mouse') {
				return;
			}

			triggerHoverStart(e, e.pointerType as PointerType);
		};

		hoverProps.onpointerleave = (e) => {
			if (!isDisabled && e.currentTarget.contains(e.target as Element)) {
				triggerHoverEnd(e, e.pointerType as PointerType);
			}
		};
	} else {
		hoverProps.ontouchstart = () => {
			state.ignoreEmulatedMouseEvents = true;
		};

		hoverProps.onmouseenter = (e) => {
			if (
				!state.ignoreEmulatedMouseEvents &&
				!globalIgnoreEmulatedMouseEvents
			) {
				triggerHoverStart(e, 'mouse');
			}

			state.ignoreEmulatedMouseEvents = false;
		};

		hoverProps.onmouseleave = (e) => {
			if (!isDisabled && e.currentTarget.contains(e.target as Element)) {
				triggerHoverEnd(e, 'mouse');
			}
		};
	}

	$effect(() => {
		if (isDisabled) {
			triggerHoverEnd(
				{ currentTarget: state.target } as MouseEvent & {
					currentTarget: EventTarget & T;
				},
				state.pointerType,
			);
		}
	});

	return {
		isHovered: () => isHovered,
		hoverProps: hoverProps,
	};
};
