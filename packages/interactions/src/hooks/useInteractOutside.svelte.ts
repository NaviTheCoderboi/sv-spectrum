import type { APISchema } from '@sv-aria/docs-utils';
import { getOwnerDocument } from '@sv-aria/utils';
import type { STarget } from '@sv-types/shared';
import type { Action } from 'svelte/action';

export const docs: APISchema = {
	props: {
		interactOutsideProps: {
			description:
				'Props for useInteractOutside hook, includes event handlers',
			type: 'InteractOutsideProps',
			required: false,
			default: '{}',
		},
	},
	returns: {
		void: {
			description: 'No return value',
			type: 'void',
		},
	},
	events: {
		interactoutside: {
			description:
				'Handler that is called when a pointer event occurs outside the target element',
			type: '(e: PointerEvent) => void',
		},
		interactoutsidestart: {
			description:
				'Handler that is called when a pointer event occurs outside the target element',
			type: '(e: PointerEvent) => void',
		},
	},
};

export interface InteractOutsideProps {
	ref: HTMLElement | null;
	onInteractOutside?: (e: PointerEvent) => void;
	onInteractOutsideStart?: (e: PointerEvent) => void;
	/** Whether the interact outside events should be disabled. */
	isDisabled?: boolean;
}

/**
 * Example, used in components like Dialogs and Popovers so they can close
 * when a user clicks outside them.
 */
export const useInteractOutside = (props: InteractOutsideProps) => {
	const { ref, onInteractOutside, isDisabled, onInteractOutsideStart } =
		props;

	const stateRef = $state({
		isPointerDown: false,
		ignoreEmulatedMouseEvents: false,
	});

	const onPointerDown = (e: PointerEvent) => {
		if (
			onInteractOutside &&
			isValidEvent(e as STarget<PointerEvent>, ref)
		) {
			if (onInteractOutsideStart) {
				onInteractOutsideStart(e);
			}
			stateRef.isPointerDown = true;
		}
	};

	const triggerInteractOutside = (e: PointerEvent) => {
		if (onInteractOutside) {
			onInteractOutside(e);
		}
	};

	$effect(() => {
		if (isDisabled) {
			return;
		}

		const documentObject = getOwnerDocument(ref);

		if (typeof PointerEvent !== 'undefined') {
			const onPointerUp = (e: PointerEvent) => {
				if (
					stateRef.isPointerDown &&
					isValidEvent(e as STarget<PointerEvent>, ref)
				) {
					triggerInteractOutside(e);
				}
				stateRef.isPointerDown = false;
			};

			documentObject.addEventListener('pointerdown', onPointerDown, true);
			documentObject.addEventListener('pointerup', onPointerUp, true);

			return () => {
				documentObject.removeEventListener(
					'pointerdown',
					onPointerDown,
					true,
				);
				documentObject.removeEventListener(
					'pointerup',
					onPointerUp,
					true,
				);
			};
		}
		const onMouseUp = (e: MouseEvent) => {
			if (stateRef.ignoreEmulatedMouseEvents) {
				stateRef.ignoreEmulatedMouseEvents = false;
			} else if (
				stateRef.isPointerDown &&
				isValidEvent(e as STarget<PointerEvent>, ref)
			) {
				triggerInteractOutside(e as unknown as PointerEvent);
			}
			stateRef.isPointerDown = false;
		};

		const onTouchEnd = (e: TouchEvent) => {
			stateRef.ignoreEmulatedMouseEvents = true;
			if (
				stateRef.isPointerDown &&
				isValidEvent(e as unknown as STarget<PointerEvent>, ref)
			) {
				triggerInteractOutside(e as unknown as PointerEvent);
			}
			stateRef.isPointerDown = false;
		};

		documentObject.addEventListener(
			'mousedown',
			onPointerDown as (this: Document, ev: MouseEvent) => any,
			true,
		);
		documentObject.addEventListener('mouseup', onMouseUp, true);
		documentObject.addEventListener(
			'touchstart',
			onPointerDown as unknown as (this: Document, ev: TouchEvent) => any,
			true,
		);
		documentObject.addEventListener('touchend', onTouchEnd, true);

		return () => {
			documentObject.removeEventListener(
				'mousedown',
				onPointerDown as (this: Document, ev: MouseEvent) => any,
				true,
			);
			documentObject.removeEventListener('mouseup', onMouseUp, true);
			documentObject.removeEventListener(
				'touchstart',
				onPointerDown as unknown as (
					this: Document,
					ev: TouchEvent,
				) => any,
				true,
			);
			documentObject.removeEventListener('touchend', onTouchEnd, true);
		};
	});
};

const isValidEvent = (
	event: STarget<PointerEvent>,
	ref: HTMLElement | null,
) => {
	if (event.button > 0) {
		return false;
	}

	if (event.target) {
		const ownerDocument = event.target.ownerDocument;
		if (
			!ownerDocument ||
			!ownerDocument.documentElement.contains(event.target as HTMLElement)
		) {
			return false;
		}

		if (event.target.closest('[data-sv-aria-top-layer]')) {
			return false;
		}
	}

	return ref && !ref.contains(event.target);
};

export const interactOutsideAction: Action<
	HTMLElement,
	Omit<InteractOutsideProps, 'ref'>
> = (node, props = {}) => {
	useInteractOutside({
		...props,
		ref: node,
	});
};
