import { isAndroid } from './platform';

/**
 * Determines if the event is a virtual click.
 * @param e {MouseEvent | PointerEvent} - The event to check.
 * @returns {boolean} - Whether the event is a virtual click.
 */
export const isVirtualClick = (e: MouseEvent | PointerEvent) => {
	if (e.mozInputSource === 0 && e.isTrusted) {
		return true;
	}

	if (isAndroid() && (e as PointerEvent).pointerType) {
		return e.type === 'click' && e.buttons === 1;
	}

	return e.detail === 0 && !(e as PointerEvent).pointerType;
};

/**
 * Determines if the event is a virtual pointer event.
 * @param event {PointerEvent} - The event to check.
 * @returns {boolean} - Whether the event is a virtual pointer event.
 */
export const isVirtualPointerEvent = (event: PointerEvent) => {
	return (
		(!isAndroid() && event.width === 0 && event.height === 0) ||
		(event.width === 1 &&
			event.height === 1 &&
			event.pressure === 0 &&
			event.detail === 0 &&
			event.pointerType === 'mouse')
	);
};
