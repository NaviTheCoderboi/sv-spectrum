import { mergeProps, useDescription, useGlobalListeners } from '@sv-aria/utils';
import type {
	DOMAttributes,
	FocusableElement,
	LongPressEvent,
} from '@sv-types/shared';
import { usePress } from './usePress.svelte';

export const docs = {
	props: {
		longPressProps: {
			description: 'Props for useLongPress hook, includes event handlers',
			type: 'LongPressProps',
			required: false,
			default: '{}',
		},
	},
	returns: {
		longPressProps: {
			description: 'Props to spread onto the target element',
			type: 'DOMAttributes<T>',
		},
	},
	events: {
		onLongPressStart: {
			description:
				'Handler that is called when a long press interaction starts',
			type: '(e: LongPressEvent<T>) => void',
		},
		onLongPressEnd: {
			description:
				'Handler that is called when a long press interaction ends',
			type: '(e: LongPressEvent<T>) => void',
		},
		onLongPress: {
			description:
				'Handler that is called when the threshold time is met',
			type: '(e: LongPressEvent<T>) => void',
		},
	},
	other: {
		LongPressEvent: {
			type: {
				description: 'The type of long press event being fired',
				type: '"longpressstart" | "longpressend" | "longpress"',
			},
			pointerType: {
				description:
					'The type of pointer that triggered the long press event',
				type: "'mouse' | 'pen' | 'touch' | 'keyboard' | 'virtual'",
			},
			target: {
				description: 'The target element of the long press event',
				type: 'T',
			},
			shiftKey: {
				description:
					'Whether the shift key was pressed during the event',
				type: 'boolean',
			},
			ctrlKey: {
				description:
					'Whether the control key was pressed during the event',
				type: 'boolean',
			},
			metaKey: {
				description:
					'Whether the meta key was pressed during the event',
				type: 'boolean',
			},
			altKey: {
				description: 'Whether the alt key was pressed during the event',
				type: 'boolean',
			},
			x: {
				description: 'The x-coordinate of the pointer during the event',
				type: 'number',
			},
			y: {
				description: 'The y-coordinate of the pointer during the event',
				type: 'number',
			},
		},
	},
};

export interface LongPressProps<T extends FocusableElement = FocusableElement> {
	/** Whether long press events should be disabled. */
	isDisabled?: boolean;
	/** Handler that is called when a long press interaction starts. */
	onLongPressStart?: (e: LongPressEvent<T>) => void;
	/**
	 * Handler that is called when a long press interaction ends, either
	 * over the target or when the pointer leaves the target.
	 */
	onLongPressEnd?: (e: LongPressEvent<T>) => void;
	/**
	 * Handler that is called when the threshold time is met while
	 * the press is over the target.
	 */
	onLongPress?: (e: LongPressEvent<T>) => void;
	/**
	 * The amount of time in milliseconds to wait before triggering a long press.
	 * @default 500ms
	 */
	threshold?: number;
	/**
	 * A description for assistive techology users indicating that a long press
	 * action is available, e.g. "Long press to open menu".
	 */
	accessibilityDescription?: string;
}

export interface LongPressResult<
	T extends FocusableElement = FocusableElement,
> {
	/** Props to spread on the target element. */
	longPressProps: DOMAttributes<T>;
}

const DEFAULT_THRESHOLD = 500;

/**
 * Handles long press interactions across mouse and touch devices. Supports a customizable time threshold,
 * accessibility description, and normalizes behavior across browsers and devices.
 */
export const useLongPress = <T extends FocusableElement = FocusableElement>(
	props: LongPressProps<T> = {},
): LongPressResult<T> => {
	const {
		isDisabled,
		onLongPressStart,
		onLongPressEnd,
		onLongPress,
		threshold = DEFAULT_THRESHOLD,
		accessibilityDescription,
	} = props;

	let timeRef: ReturnType<typeof setTimeout> | undefined = undefined;
	const { addGlobalListener, removeGlobalListener } = useGlobalListeners();

	const { pressProps } = usePress({
		isDisabled,
		onPressStart(e) {
			e.continuePropagation();
			if (e.pointerType === 'mouse' || e.pointerType === 'touch') {
				if (onLongPressStart) {
					onLongPressStart({
						...e,
						type: 'longpressstart',
					} as unknown as LongPressEvent<T>);
				}

				timeRef = setTimeout(() => {
					e.target.dispatchEvent(
						new PointerEvent('pointercancel', { bubbles: true }),
					);
					if (onLongPress) {
						onLongPress({
							...e,
							type: 'longpress',
						} as unknown as LongPressEvent<T>);
					}
					timeRef = undefined;
				}, threshold);

				if (e.pointerType === 'touch') {
					const onContextMenu = (e: MouseEvent) => {
						e.preventDefault();
					};

					addGlobalListener(e.target, 'contextmenu', onContextMenu, {
						once: true,
					});
					addGlobalListener(
						window,
						'pointerup',
						() => {
							setTimeout(() => {
								removeGlobalListener(
									e.target,
									'contextmenu',
									onContextMenu,
								);
							}, 30);
						},
						{ once: true },
					);
				}
			}
		},
		onPressEnd(e) {
			if (timeRef) {
				clearTimeout(timeRef);
			}

			if (
				onLongPressEnd &&
				(e.pointerType === 'mouse' || e.pointerType === 'touch')
			) {
				onLongPressEnd({
					...e,
					type: 'longpressend',
				} as unknown as LongPressEvent<T>);
			}
		},
	});

	const descriptionProps = useDescription(
		onLongPress && !isDisabled ? accessibilityDescription : undefined,
	);

	return {
		longPressProps: mergeProps(pressProps, descriptionProps),
	};
};
