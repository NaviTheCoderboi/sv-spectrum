import type {
	DOMAttributes,
	FocusableElement,
	PointerType,
	PressEvents,
	PressEvent as IPressEvent,
} from '@sv-types/shared';
import { PressResponderContext } from '../utils/context';
import {
	chain,
	focusWithoutScrolling,
	getOwnerDocument,
	getOwnerWindow,
	isMac,
	isVirtualClick,
	isVirtualPointerEvent,
	mergeProps,
	openLink,
	useGlobalListeners,
	useSyncRef,
} from '@sv-aria/utils';
import {
	disableTextSelection,
	restoreTextSelection,
} from '../utils/textSelection';
import { onMount } from 'svelte';
import type { APISchema } from '@sv-aria/docs-utils';
import type { Action } from 'svelte/action';

export const docs: APISchema = {
	props: {
		pressProps: {
			description: 'Props for usePress hook, includes event handlers',
			type: 'PressProps<T>',
			required: false,
			default: '{}',
		},
	},
	returns: {
		isPressed: {
			description:
				'Function to check if the element is currently pressed',
			type: '() => boolean',
		},
		pressProps: {
			description: 'Props to spread onto the target element',
			type: 'DOMAttributes<T>',
		},
	},
	events: {
		onPress: {
			description:
				'Handler that is called when a press interaction occurs',
			type: '(e: PressEvent<T>) => void',
		},
		onPressStart: {
			description:
				'Handler that is called when a press interaction starts',
			type: '(e: PressEvent<T>) => void',
		},
		onPressEnd: {
			description: 'Handler that is called when a press interaction ends',
			type: '(e: PressEvent<T>) => void',
		},
		onPressChange: {
			description: 'Handler that is called when the press state changes',
			type: '(isPressed: boolean) => void',
		},
		onPressUp: {
			description:
				'Handler that is called when a press is released over the target',
			type: '(e: PressEvent<T>) => void',
		},
	},
	other: {
		PressEvent: {
			type: {
				description: 'The type of press event being fired',
				type: '"pressstart" | "pressend" | "press" | "pressup"',
			},
			pointerType: {
				description:
					'The type of pointer that triggered the press event',
				type: "'mouse' | 'pen' | 'touch' | 'keyboard' | 'virtual'",
			},
			target: {
				description: 'The target element of the press event',
				type: 'T',
			},
			shiftKey: {
				description: 'Whether the shift key was pressed',
				type: 'boolean',
			},
			ctrlKey: {
				description: 'Whether the ctrl key was pressed',
				type: 'boolean',
			},
			metaKey: {
				description: 'Whether the meta key was pressed',
				type: 'boolean',
			},
			altKey: {
				description: 'Whether the alt key was pressed',
				type: 'boolean',
			},
			x: {
				description: 'The x position of the press event',
				type: 'number',
			},
			y: {
				description: 'The y position of the press event',
				type: 'number',
			},
		},
		methods: {
			continuePropagation: {
				description:
					'Prevents the press event from stopping propagation',
				type: '() => void',
			},
		},
	},
};

export interface PressProps<T extends FocusableElement = FocusableElement>
	extends PressEvents<T> {
	/** Whether the target is in a controlled press state (e.g. an overlay it triggers is open). */
	isPressed?: boolean;
	/** Whether the press events should be disabled. */
	isDisabled?: boolean;
	/** Whether the target should not receive focus on press. */
	preventFocusOnPress?: boolean;
	/**
	 * Whether press events should be canceled when the pointer leaves the target while pressed.
	 * By default, this is `false`, which means if the pointer returns back over the target while
	 * still pressed, onPressStart will be fired again. If set to `true`, the press is canceled
	 * when the pointer leaves the target and onPressStart will not be fired if the pointer returns.
	 */
	shouldCancelOnPointerExit?: boolean;
	/** Whether text selection should be enabled on the pressable element. */
	allowTextSelectionOnPress?: boolean;
}

export interface PressHookProps<T extends FocusableElement = FocusableElement>
	extends PressProps<T> {
	/** A ref to the target element. */
	ref?: T | null;
}

interface PressState<T extends FocusableElement = FocusableElement> {
	isPressed: boolean;
	ignoreEmulatedMouseEvents: boolean;
	ignoreClickAfterPress: boolean;
	didFirePressStart: boolean;
	isTriggeringEvent: boolean;
	activePointerId: any;
	target: T | null;
	isOverTarget: boolean;
	pointerType: PointerType | null;
	userSelect?: string;
	metaKeyEvents?: Map<string, KeyboardEvent>;
}

interface EventBase<T extends FocusableElement = FocusableElement> {
	currentTarget: (EventTarget & T) | null;
	shiftKey: boolean;
	ctrlKey: boolean;
	metaKey: boolean;
	altKey: boolean;
	clientX?: number;
	clientY?: number;
	targetTouches?: Array<{ clientX?: number; clientY?: number }>;
}

export interface PressResult<T extends FocusableElement = FocusableElement> {
	/** Whether the target is currently pressed. */
	isPressed: () => boolean;
	/** Props to spread on the target element. */
	pressProps: DOMAttributes<T>;
}

const usePressResponderContext = <
	T extends FocusableElement = FocusableElement,
>(
	props: PressHookProps<T>,
): PressHookProps<T> => {
	const context = PressResponderContext.get();
	if (context) {
		const { register, ...contextProps } = context;
		props = mergeProps(contextProps, props) as PressHookProps<T>;
		register();
	}

	useSyncRef(
		PressResponderContext,
		props.ref as FocusableElement | undefined | null,
	);

	return props;
};

class PressEvent<T extends FocusableElement = FocusableElement>
	implements IPressEvent<T>
{
	type: IPressEvent['type'];
	pointerType: PointerType;
	target: EventTarget & T;
	shiftKey: boolean;
	ctrlKey: boolean;
	metaKey: boolean;
	altKey: boolean;
	x: number;
	y: number;
	#shouldStopPropagation = true;

	constructor(
		type: IPressEvent['type'],
		pointerType: PointerType,
		originalEvent: EventBase<T>,
		state?: PressState,
	) {
		const currentTarget = state?.target ?? originalEvent.currentTarget;
		const rect: DOMRect | undefined =
			currentTarget?.getBoundingClientRect();
		let x = 0;
		let y = 0;
		let clientX: number | null = null;
		let clientY: number | null = null;
		if (originalEvent.clientX != null && originalEvent.clientY != null) {
			clientX = originalEvent.clientX;
			clientY = originalEvent.clientY;
		}
		if (rect) {
			if (clientX != null && clientY != null) {
				x = clientX - rect.left;
				y = clientY - rect.top;
			} else {
				x = rect.width / 2;
				y = rect.height / 2;
			}
		}
		this.type = type;
		this.pointerType = pointerType;
		this.target = originalEvent.currentTarget as EventTarget & T;
		this.shiftKey = originalEvent.shiftKey;
		this.metaKey = originalEvent.metaKey;
		this.ctrlKey = originalEvent.ctrlKey;
		this.altKey = originalEvent.altKey;
		this.x = x;
		this.y = y;
	}

	continuePropagation() {
		this.#shouldStopPropagation = false;
	}

	get shouldStopPropagation() {
		return this.#shouldStopPropagation;
	}
}

const LINK_CLICKED = Symbol('linkClicked');

/**
 * Handles press interactions across mouse, touch, keyboard, and screen readers.
 * It normalizes behavior across browsers and platforms, and handles many nuances
 * of dealing with pointer and keyboard events.
 */
export const usePress = <T extends FocusableElement = FocusableElement>(
	props: PressHookProps<T> = {},
): PressResult<T> => {
	const {
		onPress,
		onPressChange,
		onPressStart,
		onPressEnd,
		onPressUp,
		isDisabled,
		isPressed: isPressedProp,
		preventFocusOnPress,
		shouldCancelOnPointerExit,
		allowTextSelectionOnPress,
		ref: _,
		...domProps
	} = usePressResponderContext(props);

	let isPressed = $state(false);
	const ref = $state<PressState<T>>({
		isPressed: false,
		ignoreEmulatedMouseEvents: false,
		ignoreClickAfterPress: false,
		didFirePressStart: false,
		isTriggeringEvent: false,
		activePointerId: null,
		target: null,
		isOverTarget: false,
		pointerType: null,
	});

	const { addGlobalListener, removeAllGlobalListeners } =
		useGlobalListeners();

	const triggerPressStart = (
		originalEvent: EventBase,
		pointerType: PointerType,
	) => {
		if (isDisabled || ref.didFirePressStart) {
			return false;
		}

		let shouldStopPropagation = true;
		ref.isTriggeringEvent = true;
		if (onPressStart) {
			const event = new PressEvent(
				'pressstart',
				pointerType,
				originalEvent,
			);
			onPressStart(event as unknown as IPressEvent<T>);
			shouldStopPropagation = event.shouldStopPropagation;
		}

		if (onPressChange) {
			onPressChange(true);
		}

		ref.isTriggeringEvent = false;
		ref.didFirePressStart = true;
		isPressed = true;
		return shouldStopPropagation;
	};

	const triggerPressEnd = (
		originalEvent: EventBase,
		pointerType: PointerType,
		wasPressed = true,
	) => {
		if (!ref.didFirePressStart) {
			return false;
		}

		ref.ignoreClickAfterPress = true;
		ref.didFirePressStart = false;
		ref.isTriggeringEvent = true;

		let shouldStopPropagation = true;
		if (onPressEnd) {
			const event = new PressEvent(
				'pressend',
				pointerType,
				originalEvent,
			);
			onPressEnd(event as unknown as IPressEvent<T>);
			shouldStopPropagation = event.shouldStopPropagation;
		}

		if (onPressChange) {
			onPressChange(false);
		}

		isPressed = false;

		if (onPress && wasPressed && !isDisabled) {
			const event = new PressEvent('press', pointerType, originalEvent);
			onPress(event as unknown as IPressEvent<T>);
			shouldStopPropagation &&= event.shouldStopPropagation;
		}

		ref.isTriggeringEvent = false;
		return shouldStopPropagation;
	};

	const triggerPressUp = (
		originalEvent: EventBase,
		pointerType: PointerType,
	) => {
		if (isDisabled) {
			return false;
		}

		if (onPressUp) {
			ref.isTriggeringEvent = true;
			const event = new PressEvent('pressup', pointerType, originalEvent);
			onPressUp(event as unknown as IPressEvent<T>);
			ref.isTriggeringEvent = false;
			return event.shouldStopPropagation;
		}

		return true;
	};

	const cancel = (e: EventBase) => {
		if (ref.isPressed && ref.target) {
			if (ref.isOverTarget && ref.pointerType != null) {
				triggerPressEnd(
					createEvent(ref.target, e),
					ref.pointerType,
					false,
				);
			}
			ref.isPressed = false;
			ref.isOverTarget = false;
			ref.activePointerId = null;
			ref.pointerType = null;
			removeAllGlobalListeners();
			if (!allowTextSelectionOnPress) {
				restoreTextSelection(ref.target);
			}
		}
	};

	const cancelOnPointerExit = (e: EventBase) => {
		if (shouldCancelOnPointerExit) {
			cancel(e);
		}
	};

	const pressProps: DOMAttributes<T> = {
		onkeydown: (e) => {
			if (
				isValidKeyboardEvent(e, e.currentTarget) &&
				e.currentTarget.contains(e.target as Element)
			) {
				if (shouldPreventDefaultKeyboard(e.target as Element, e.key)) {
					e.preventDefault();
				}

				let shouldStopPropagation = true;
				if (!ref.isPressed && !e.repeat) {
					ref.target = e.currentTarget;
					ref.isPressed = true;
					shouldStopPropagation = triggerPressStart(e, 'keyboard');

					const originalTarget = e.currentTarget;
					const pressUp = (e: KeyboardEvent) => {
						if (
							isValidKeyboardEvent(e, originalTarget) &&
							!e.repeat &&
							originalTarget.contains(e.target as Element) &&
							ref.target
						) {
							triggerPressUp(
								createEvent(ref.target, e as EventBase<T>),
								'keyboard',
							);
						}
					};

					addGlobalListener(
						getOwnerDocument(e.currentTarget),
						'keyup',
						chain(pressUp, onKeyUp),
						true,
					);
				}

				if (shouldStopPropagation) {
					e.stopPropagation();
				}

				if (e.metaKey && isMac()) {
					ref.metaKeyEvents?.set(e.key, e);
				}
			} else if (e.key === 'Meta') {
				ref.metaKeyEvents = new Map();
			}
		},
		onclick: (e) => {
			if (!e.currentTarget.contains(e.target as Element)) {
				return;
			}

			if (
				e.button === 0 &&
				!ref.isTriggeringEvent &&
				!(openLink as any).isOpening
			) {
				let shouldStopPropagation = true;
				if (isDisabled) {
					e.preventDefault();
				}

				if (
					!ref.ignoreClickAfterPress &&
					!ref.ignoreEmulatedMouseEvents &&
					!ref.isPressed &&
					(ref.pointerType === 'virtual' || isVirtualClick(e))
				) {
					if (!isDisabled && !preventFocusOnPress) {
						focusWithoutScrolling(e.currentTarget);
					}

					const stopPressStart = triggerPressStart(e, 'virtual');
					const stopPressUp = triggerPressUp(e, 'virtual');
					const stopPressEnd = triggerPressEnd(e, 'virtual');
					shouldStopPropagation =
						stopPressStart && stopPressUp && stopPressEnd;
				}

				ref.ignoreEmulatedMouseEvents = false;
				ref.ignoreClickAfterPress = false;
				if (shouldStopPropagation) {
					e.stopPropagation();
				}
			}
		},
	};

	const onKeyUp = (e: KeyboardEvent) => {
		if (
			ref.isPressed &&
			ref.target &&
			isValidKeyboardEvent(e, ref.target)
		) {
			if (shouldPreventDefaultKeyboard(e.target as Element, e.key)) {
				e.preventDefault();
			}

			const target = e.target as Element;
			triggerPressEnd(
				createEvent(ref.target, e as EventBase<T>),
				'keyboard',
				ref.target.contains(target),
			);
			removeAllGlobalListeners();

			if (
				e.key !== 'Enter' &&
				isHTMLAnchorLink(ref.target) &&
				ref.target.contains(target) &&
				// @ts-expect-error - ignore it for now
				!e[LINK_CLICKED]
			) {
				// @ts-expect-error - ignore it for now
				e[LINK_CLICKED] = true;
				openLink(ref.target, e, false);
			}

			ref.isPressed = false;
			ref.metaKeyEvents?.delete(e.key);
		} else if (e.key === 'Meta' && ref.metaKeyEvents?.size) {
			const events = ref.metaKeyEvents;
			ref.metaKeyEvents = undefined;
			for (const event of events.values()) {
				ref.target?.dispatchEvent(new KeyboardEvent('keyup', event));
			}
		}
	};

	if (typeof PointerEvent !== 'undefined') {
		pressProps.onpointerdown = (e) => {
			if (
				e.button !== 0 ||
				!e.currentTarget.contains(e.target as Element)
			) {
				return;
			}

			if (isVirtualPointerEvent(e)) {
				ref.pointerType = 'virtual';
				return;
			}

			// Due to browser inconsistencies, especially on mobile browsers, we prevent
			// default on pointer down and handle focusing the pressable element ourselves.
			if (shouldPreventDefault(e.currentTarget as Element)) {
				e.preventDefault();
			}

			ref.pointerType = e.pointerType as PointerType;

			let shouldStopPropagation = true;
			if (!ref.isPressed) {
				ref.isPressed = true;
				ref.isOverTarget = true;
				ref.activePointerId = e.pointerId;
				ref.target = e.currentTarget;

				if (!isDisabled && !preventFocusOnPress) {
					focusWithoutScrolling(e.currentTarget);
				}

				if (!allowTextSelectionOnPress) {
					disableTextSelection(ref.target);
				}

				shouldStopPropagation = triggerPressStart(e, ref.pointerType);

				addGlobalListener(
					getOwnerDocument(e.currentTarget),
					'pointermove',
					onPointerMove,
					false,
				);
				addGlobalListener(
					getOwnerDocument(e.currentTarget),
					'pointerup',
					onPointerUp,
					false,
				);
				addGlobalListener(
					getOwnerDocument(e.currentTarget),
					'pointercancel',
					onPointerCancel,
					false,
				);
			}

			if (shouldStopPropagation) {
				e.stopPropagation();
			}
		};

		pressProps.onmousedown = (e) => {
			if (!e.currentTarget.contains(e.target as Element)) {
				return;
			}

			if (e.button === 0) {
				if (shouldPreventDefault(e.currentTarget as Element)) {
					e.preventDefault();
				}

				e.stopPropagation();
			}
		};

		pressProps.onpointerup = (e) => {
			if (
				!e.currentTarget.contains(e.target as Element) ||
				ref.pointerType === 'virtual'
			) {
				return;
			}

			if (e.button === 0 && isOverTarget(e, e.currentTarget)) {
				triggerPressUp(
					e,
					ref.pointerType || (e.pointerType as PointerType),
				);
			}
		};

		const onPointerMove = (e: PointerEvent) => {
			if (e.pointerId !== ref.activePointerId) {
				return;
			}

			if (ref.target && isOverTarget(e, ref.target)) {
				if (!ref.isOverTarget && ref.pointerType != null) {
					ref.isOverTarget = true;
					triggerPressStart(
						createEvent(ref.target, e as EventBase<T>),
						ref.pointerType,
					);
				}
			} else if (
				ref.target &&
				ref.isOverTarget &&
				ref.pointerType != null
			) {
				ref.isOverTarget = false;
				triggerPressEnd(
					createEvent(ref.target, e as EventBase<T>),
					ref.pointerType,
					false,
				);
				cancelOnPointerExit(e as EventBase<T>);
			}
		};

		const onPointerUp = (e: PointerEvent) => {
			if (
				e.pointerId === ref.activePointerId &&
				ref.isPressed &&
				e.button === 0 &&
				ref.target
			) {
				if (isOverTarget(e, ref.target) && ref.pointerType != null) {
					triggerPressEnd(
						createEvent(ref.target, e as EventBase<T>),
						ref.pointerType,
					);
				} else if (ref.isOverTarget && ref.pointerType != null) {
					triggerPressEnd(
						createEvent(ref.target, e as EventBase<T>),
						ref.pointerType,
						false,
					);
				}

				ref.isPressed = false;
				ref.isOverTarget = false;
				ref.activePointerId = null;
				ref.pointerType = null;
				removeAllGlobalListeners();
				if (!allowTextSelectionOnPress) {
					restoreTextSelection(ref.target);
				}
			}
		};

		const onPointerCancel = (e: PointerEvent) => {
			cancel(e as EventBase<T>);
		};

		pressProps.ondragstart = (e) => {
			if (!e.currentTarget.contains(e.target as Element)) {
				return;
			}

			cancel(e);
		};
	} else {
		pressProps.onmousedown = (e) => {
			if (
				e.button !== 0 ||
				!e.currentTarget.contains(e.target as Element)
			) {
				return;
			}

			if (shouldPreventDefault(e.currentTarget)) {
				e.preventDefault();
			}

			if (ref.ignoreEmulatedMouseEvents) {
				e.stopPropagation();
				return;
			}

			ref.isPressed = true;
			ref.isOverTarget = true;
			ref.target = e.currentTarget;
			ref.pointerType = isVirtualClick(e) ? 'virtual' : 'mouse';

			if (!isDisabled && !preventFocusOnPress) {
				focusWithoutScrolling(e.currentTarget);
			}

			const shouldStopPropagation = triggerPressStart(e, ref.pointerType);
			if (shouldStopPropagation) {
				e.stopPropagation();
			}

			addGlobalListener(
				getOwnerDocument(e.currentTarget),
				'mouseup',
				onMouseUp,
				false,
			);
		};

		pressProps.onmouseenter = (e) => {
			if (!e.currentTarget.contains(e.target as Element)) {
				return;
			}

			let shouldStopPropagation = true;
			if (
				ref.isPressed &&
				!ref.ignoreEmulatedMouseEvents &&
				ref.pointerType != null
			) {
				ref.isOverTarget = true;
				shouldStopPropagation = triggerPressStart(e, ref.pointerType);
			}

			if (shouldStopPropagation) {
				e.stopPropagation();
			}
		};

		pressProps.onmouseleave = (e) => {
			if (!e.currentTarget.contains(e.target as Element)) {
				return;
			}

			let shouldStopPropagation = true;
			if (
				ref.isPressed &&
				!ref.ignoreEmulatedMouseEvents &&
				ref.pointerType != null
			) {
				ref.isOverTarget = false;
				shouldStopPropagation = triggerPressEnd(
					e,
					ref.pointerType,
					false,
				);
				cancelOnPointerExit(e);
			}

			if (shouldStopPropagation) {
				e.stopPropagation();
			}
		};

		pressProps.onmouseup = (e) => {
			if (!e.currentTarget.contains(e.target as Element)) {
				return;
			}

			if (!ref.ignoreEmulatedMouseEvents && e.button === 0) {
				triggerPressUp(e, ref.pointerType || 'mouse');
			}
		};

		const onMouseUp = (e: MouseEvent) => {
			if (e.button !== 0) {
				return;
			}

			ref.isPressed = false;
			removeAllGlobalListeners();

			if (ref.ignoreEmulatedMouseEvents) {
				ref.ignoreEmulatedMouseEvents = false;
				return;
			}

			if (
				ref.target &&
				isOverTarget(e, ref.target) &&
				ref.pointerType != null
			) {
				triggerPressEnd(
					createEvent(ref.target, e as EventBase<T>),
					ref.pointerType,
				);
			} else if (
				ref.target &&
				ref.isOverTarget &&
				ref.pointerType != null
			) {
				triggerPressEnd(
					createEvent(ref.target, e as EventBase<T>),
					ref.pointerType,
					false,
				);
			}

			ref.isOverTarget = false;
		};

		pressProps.ontouchstart = (e) => {
			if (!e.currentTarget.contains(e.target as Element)) {
				return;
			}

			const touch = getTouchFromEvent(e);
			if (!touch) {
				return;
			}
			ref.activePointerId = touch.identifier;
			ref.ignoreEmulatedMouseEvents = true;
			ref.isOverTarget = true;
			ref.isPressed = true;
			ref.target = e.currentTarget;
			ref.pointerType = 'touch';

			if (!isDisabled && !preventFocusOnPress) {
				focusWithoutScrolling(e.currentTarget);
			}

			if (!allowTextSelectionOnPress) {
				disableTextSelection(ref.target);
			}

			const shouldStopPropagation = triggerPressStart(
				createTouchEvent(ref.target, e),
				ref.pointerType,
			);
			if (shouldStopPropagation) {
				e.stopPropagation();
			}

			addGlobalListener(
				getOwnerWindow(e.currentTarget),
				'scroll',
				onScroll,
				true,
			);
		};

		pressProps.ontouchmove = (e) => {
			if (!e.currentTarget.contains(e.target as Element)) {
				return;
			}

			if (!ref.isPressed) {
				e.stopPropagation();
				return;
			}

			const touch = getTouchById(e, ref.activePointerId);
			let shouldStopPropagation = true;
			if (touch && isOverTarget(touch, e.currentTarget)) {
				if (!ref.isOverTarget && ref.pointerType != null) {
					ref.isOverTarget = true;
					shouldStopPropagation = triggerPressStart(
						createTouchEvent(ref.target!, e),
						ref.pointerType,
					);
				}
			} else if (ref.isOverTarget && ref.pointerType != null) {
				ref.isOverTarget = false;
				shouldStopPropagation = triggerPressEnd(
					createTouchEvent(ref.target!, e),
					ref.pointerType,
					false,
				);
				cancelOnPointerExit(createTouchEvent(ref.target!, e));
			}

			if (shouldStopPropagation) {
				e.stopPropagation();
			}
		};

		pressProps.ontouchend = (e) => {
			if (!e.currentTarget.contains(e.target as Element)) {
				return;
			}

			if (!ref.isPressed) {
				e.stopPropagation();
				return;
			}

			const touch = getTouchById(e, ref.activePointerId);
			let shouldStopPropagation = true;
			if (
				touch &&
				isOverTarget(touch, e.currentTarget) &&
				ref.pointerType != null
			) {
				triggerPressUp(
					createTouchEvent(ref.target!, e),
					ref.pointerType,
				);
				shouldStopPropagation = triggerPressEnd(
					createTouchEvent(ref.target!, e),
					ref.pointerType,
				);
			} else if (ref.isOverTarget && ref.pointerType != null) {
				shouldStopPropagation = triggerPressEnd(
					createTouchEvent(ref.target!, e),
					ref.pointerType,
					false,
				);
			}

			if (shouldStopPropagation) {
				e.stopPropagation();
			}

			ref.isPressed = false;
			ref.activePointerId = null;
			ref.isOverTarget = false;
			ref.ignoreEmulatedMouseEvents = true;
			if (ref.target && !allowTextSelectionOnPress) {
				restoreTextSelection(ref.target);
			}
			removeAllGlobalListeners();
		};

		pressProps.ontouchcancel = (e) => {
			if (!e.currentTarget.contains(e.target as Element)) {
				return;
			}

			e.stopPropagation();
			if (ref.isPressed) {
				cancel(createTouchEvent(ref.target!, e));
			}
		};

		const onScroll = (e: Event) => {
			if (ref.isPressed && (e.target as Element).contains(ref.target)) {
				cancel({
					currentTarget: ref.target,
					shiftKey: false,
					ctrlKey: false,
					metaKey: false,
					altKey: false,
				});
			}
		};

		pressProps.ondragstart = (e) => {
			if (!e.currentTarget.contains(e.target as Element)) {
				return;
			}

			cancel(e);
		};
	}

	onMount(() => {
		return () => {
			if (!allowTextSelectionOnPress) {
				restoreTextSelection(ref.target ?? undefined);
			}
		};
	});

	return {
		isPressed: () => isPressed,
		pressProps: mergeProps(domProps, pressProps),
	};
};

const isHTMLAnchorLink = (target: Element): target is HTMLAnchorElement => {
	return target.tagName === 'A' && target.hasAttribute('href');
};

const isValidKeyboardEvent = (
	event: KeyboardEvent,
	currentTarget: Element,
): boolean => {
	const { key, code } = event;
	const element = currentTarget as HTMLElement;
	const role = element.getAttribute('role');
	return (
		(key === 'Enter' ||
			key === ' ' ||
			key === 'Spacebar' ||
			code === 'Space') &&
		!(
			(element instanceof getOwnerWindow(element).HTMLInputElement &&
				!isValidInputKey(element, key)) ||
			element instanceof getOwnerWindow(element).HTMLTextAreaElement ||
			element.isContentEditable
		) &&
		!(
			(role === 'link' || (!role && isHTMLAnchorLink(element))) &&
			key !== 'Enter'
		)
	);
};

const getTouchFromEvent = (event: TouchEvent): Touch | null => {
	const { targetTouches } = event;
	if (targetTouches.length > 0) {
		return targetTouches[0];
	}
	return null;
};

const getTouchById = (
	event: TouchEvent,
	pointerId: null | number,
): null | Touch => {
	const changedTouches = event.changedTouches;
	for (let i = 0; i < changedTouches.length; i++) {
		const touch = changedTouches[i];
		if (touch.identifier === pointerId) {
			return touch;
		}
	}
	return null;
};

const createTouchEvent = (
	target: FocusableElement,
	e: TouchEvent,
): EventBase => {
	let clientX = 0;
	let clientY = 0;
	if (e.targetTouches.length === 1) {
		clientX = e.targetTouches[0].clientX;
		clientY = e.targetTouches[0].clientY;
	}
	return {
		currentTarget: target,
		shiftKey: e.shiftKey,
		ctrlKey: e.ctrlKey,
		metaKey: e.metaKey,
		altKey: e.altKey,
		clientX,
		clientY,
	};
};

const createEvent = (target: FocusableElement, e: EventBase): EventBase => {
	const clientX = e.clientX;
	const clientY = e.clientY;
	return {
		currentTarget: target,
		shiftKey: e.shiftKey,
		ctrlKey: e.ctrlKey,
		metaKey: e.metaKey,
		altKey: e.altKey,
		clientX,
		clientY,
	};
};

interface Rect {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

interface EventPoint {
	clientX: number;
	clientY: number;
	width?: number;
	height?: number;
	radiusX?: number;
	radiusY?: number;
}

const getPointClientRect = (point: EventPoint): Rect => {
	let offsetX = 0;
	let offsetY = 0;
	if (point.width !== undefined) {
		offsetX = point.width / 2;
	} else if (point.radiusX !== undefined) {
		offsetX = point.radiusX;
	}
	if (point.height !== undefined) {
		offsetY = point.height / 2;
	} else if (point.radiusY !== undefined) {
		offsetY = point.radiusY;
	}

	return {
		top: point.clientY - offsetY,
		right: point.clientX + offsetX,
		bottom: point.clientY + offsetY,
		left: point.clientX - offsetX,
	};
};

const areRectanglesOverlapping = (a: Rect, b: Rect) => {
	if (a.left > b.right || b.left > a.right) {
		return false;
	}
	if (a.top > b.bottom || b.top > a.bottom) {
		return false;
	}
	return true;
};

const isOverTarget = (point: EventPoint, target: Element) => {
	const rect = target.getBoundingClientRect();
	const pointRect = getPointClientRect(point);
	return areRectanglesOverlapping(rect, pointRect);
};

const shouldPreventDefault = (target: Element) => {
	return (
		!(target instanceof HTMLElement) || !target.hasAttribute('draggable')
	);
};

const shouldPreventDefaultKeyboard = (target: Element, key: string) => {
	if (target instanceof HTMLInputElement) {
		return !isValidInputKey(target, key);
	}

	if (target instanceof HTMLButtonElement) {
		return target.type !== 'submit' && target.type !== 'reset';
	}

	if (isHTMLAnchorLink(target)) {
		return false;
	}

	return true;
};

const nonTextInputTypes = new Set([
	'checkbox',
	'radio',
	'range',
	'color',
	'file',
	'image',
	'button',
	'submit',
	'reset',
]);

const isValidInputKey = (target: HTMLInputElement, key: string) => {
	return target.type === 'checkbox' || target.type === 'radio'
		? key === ' '
		: nonTextInputTypes.has(target.type);
};
