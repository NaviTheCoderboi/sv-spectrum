import { useGlobalListeners } from '@sv-aria/utils';
import {
	disableTextSelection,
	restoreTextSelection,
} from '../utils/textSelection';
import type { DOMAttributes, MoveEvents, PointerType } from '@sv-types/shared';
import type { APISchema } from '@sv-aria/docs-utils';

export const docs: APISchema = {
	props: {
		moveProps: {
			description: 'Props for useMove hook, includes event handlers',
			type: 'MoveEvents',
			required: false,
			default: '{}',
		},
	},
	returns: {
		moveProps: {
			description: 'Props to spread onto the target element',
			type: 'DOMAttributes<T>',
		},
	},
	events: {
		onMoveStart: {
			description:
				'Handler that is called when a move interaction starts',
			type: '(e: MoveStartEvent) => void',
		},
		onMove: {
			description:
				'Handler that is called when a move interaction occurs',
			type: '(e: MoveMoveEvent) => void',
		},
		onMoveEnd: {
			description: 'Handler that is called when a move interaction ends',
			type: '(e: MoveEndEvent) => void',
		},
	},
	other: {
		MoveEvent: {
			type: {
				description: 'The type of move event being fired',
				type: '"movestart" | "move" | "moveend"',
			},
			deltaX: {
				description:
					'The amount moved in the X direction since the last event',
				type: 'number',
			},
			deltaY: {
				description:
					'The amount moved in the Y direction since the last event',
				type: 'number',
			},
			pointerType: {
				description:
					'The type of pointer that triggered the move event',
				type: "'mouse' | 'pen' | 'touch' | 'keyboard' | 'virtual'",
			},
			shiftKey: {
				description:
					'Whether the shift keyboard modifier was held during the move event',
				type: 'boolean',
			},
			ctrlKey: {
				description:
					'Whether the ctrl keyboard modifier was held during the move event',
				type: 'boolean',
			},
			metaKey: {
				description:
					'Whether the meta keyboard modifier was held during the move event',
				type: 'boolean',
			},
			altKey: {
				description:
					'Whether the alt keyboard modifier was held during the move event',
				type: 'boolean',
			},
		},
	},
};

export interface MoveResult<T extends HTMLElement = HTMLElement> {
	/** Props to spread on the target element. */
	moveProps: DOMAttributes<T>;
	/** State of move */
	state: () => {
		didMove: boolean;
		lastPosition: { pageX: number; pageY: number } | null;
		id: number | null;
	};
}

interface EventBase {
	shiftKey: boolean;
	ctrlKey: boolean;
	metaKey: boolean;
	altKey: boolean;
}
/**
 * Handles move interactions across mouse, touch, and keyboard, including dragging with
 * the mouse or touch, and using the arrow keys. Normalizes behavior across browsers and
 * platforms, and ignores emulated mouse events on touch devices.
 */
export const useMove = <T extends HTMLElement = HTMLElement>(
	props: MoveEvents = {},
): MoveResult<T> => {
	const { onMoveStart, onMove, onMoveEnd } = props;

	const state = $state<{
		didMove: boolean;
		lastPosition: { pageX: number; pageY: number } | null;
		id: number | null;
	}>({ didMove: false, lastPosition: null, id: null });

	const { addGlobalListener, removeGlobalListener } = useGlobalListeners();

	const move = (
		originalEvent: EventBase,
		pointerType: PointerType,
		deltaX: number,
		deltaY: number,
	) => {
		if (deltaX === 0 && deltaY === 0) {
			return;
		}

		if (!state.didMove) {
			state.didMove = true;
			onMoveStart?.({
				type: 'movestart',
				pointerType,
				shiftKey: originalEvent.shiftKey,
				metaKey: originalEvent.metaKey,
				ctrlKey: originalEvent.ctrlKey,
				altKey: originalEvent.altKey,
			});
		}
		onMove?.({
			type: 'move',
			pointerType,
			deltaX: deltaX,
			deltaY: deltaY,
			shiftKey: originalEvent.shiftKey,
			metaKey: originalEvent.metaKey,
			ctrlKey: originalEvent.ctrlKey,
			altKey: originalEvent.altKey,
		});
	};

	const end = (originalEvent: EventBase, pointerType: PointerType) => {
		restoreTextSelection();
		if (state.didMove) {
			onMoveEnd?.({
				type: 'moveend',
				pointerType,
				shiftKey: originalEvent.shiftKey,
				metaKey: originalEvent.metaKey,
				ctrlKey: originalEvent.ctrlKey,
				altKey: originalEvent.altKey,
			});
		}
	};

	const moveProps: DOMAttributes<T> = {};

	const start = () => {
		disableTextSelection();
		state.didMove = false;
	};

	if (typeof PointerEvent === 'undefined') {
		const onMouseMove = (e: MouseEvent) => {
			if (e.button === 0) {
				move(
					e,
					'mouse',
					e.pageX - (state.lastPosition?.pageX ?? 0),
					e.pageY - (state.lastPosition?.pageY ?? 0),
				);
				state.lastPosition = {
					pageX: e.pageX,
					pageY: e.pageY,
				};
			}
		};
		const onMouseUp = (e: MouseEvent) => {
			if (e.button === 0) {
				end(e, 'mouse');
				removeGlobalListener(window, 'mousemove', onMouseMove, false);
				removeGlobalListener(window, 'mouseup', onMouseUp, false);
			}
		};
		moveProps.onmousedown = (e: MouseEvent) => {
			if (e.button === 0) {
				start();
				e.stopPropagation();
				e.preventDefault();
				state.lastPosition = {
					pageX: e.pageX,
					pageY: e.pageY,
				};
				addGlobalListener(window, 'mousemove', onMouseMove, false);
				addGlobalListener(window, 'mouseup', onMouseUp, false);
			}
		};

		const onTouchMove = (e: TouchEvent) => {
			const touch = [...e.changedTouches].findIndex(
				({ identifier }) => identifier === state.id,
			);
			if (touch >= 0) {
				const { pageX, pageY } = e.changedTouches[touch];
				move(
					e,
					'touch',
					pageX - (state.lastPosition?.pageX ?? 0),
					pageY - (state.lastPosition?.pageY ?? 0),
				);
				state.lastPosition = { pageX, pageY };
			}
		};
		const onTouchEnd = (e: TouchEvent) => {
			const touch = [...e.changedTouches].findIndex(
				({ identifier }) => identifier === state.id,
			);
			if (touch >= 0) {
				end(e, 'touch');
				state.id = null;
				removeGlobalListener(window, 'touchmove', onTouchMove);
				removeGlobalListener(window, 'touchend', onTouchEnd);
				removeGlobalListener(window, 'touchcancel', onTouchEnd);
			}
		};
		moveProps.ontouchstart = (e: TouchEvent) => {
			if (e.changedTouches.length === 0 || state.id != null) {
				return;
			}

			const { pageX, pageY, identifier } = e.changedTouches[0];
			start();
			e.stopPropagation();
			e.preventDefault();
			state.lastPosition = { pageX, pageY };
			state.id = identifier;
			addGlobalListener(window, 'touchmove', onTouchMove, false);
			addGlobalListener(window, 'touchend', onTouchEnd, false);
			addGlobalListener(window, 'touchcancel', onTouchEnd, false);
		};
	} else {
		const onPointerMove = (e: PointerEvent) => {
			if (e.pointerId === state.id) {
				const pointerType = (e.pointerType || 'mouse') as PointerType;

				move(
					e,
					pointerType,
					e.pageX - (state.lastPosition?.pageX ?? 0),
					e.pageY - (state.lastPosition?.pageY ?? 0),
				);
				state.lastPosition = {
					pageX: e.pageX,
					pageY: e.pageY,
				};
			}
		};

		const onPointerUp = (e: PointerEvent) => {
			if (e.pointerId === state.id) {
				const pointerType = (e.pointerType || 'mouse') as PointerType;
				end(e, pointerType);
				state.id = null;
				removeGlobalListener(
					window,
					'pointermove',
					onPointerMove,
					false,
				);
				removeGlobalListener(window, 'pointerup', onPointerUp, false);
				removeGlobalListener(
					window,
					'pointercancel',
					onPointerUp,
					false,
				);
			}
		};

		moveProps.onpointerdown = (e: PointerEvent) => {
			if (e.button === 0 && state.id == null) {
				start();
				e.stopPropagation();
				e.preventDefault();
				state.lastPosition = {
					pageX: e.pageX,
					pageY: e.pageY,
				};
				state.id = e.pointerId;
				addGlobalListener(window, 'pointermove', onPointerMove, false);
				addGlobalListener(window, 'pointerup', onPointerUp, false);
				addGlobalListener(window, 'pointercancel', onPointerUp, false);
			}
		};
	}

	const triggerKeyboardMove = (
		e: EventBase,
		deltaX: number,
		deltaY: number,
	) => {
		start();
		move(e, 'keyboard', deltaX, deltaY);
		end(e, 'keyboard');
	};

	moveProps.onkeydown = (e) => {
		switch (e.key) {
			case 'Left':
			case 'ArrowLeft':
				e.preventDefault();
				e.stopPropagation();
				triggerKeyboardMove(e, -1, 0);
				break;
			case 'Right':
			case 'ArrowRight':
				e.preventDefault();
				e.stopPropagation();
				triggerKeyboardMove(e, 1, 0);
				break;
			case 'Up':
			case 'ArrowUp':
				e.preventDefault();
				e.stopPropagation();
				triggerKeyboardMove(e, 0, -1);
				break;
			case 'Down':
			case 'ArrowDown':
				e.preventDefault();
				e.stopPropagation();
				triggerKeyboardMove(e, 0, 1);
				break;
		}
	};

	return {
		moveProps,
		state: () => state,
	};
};
