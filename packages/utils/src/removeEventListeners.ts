import type { DOMAttributes } from '@sv-types/shared';

const mouseEvents = [
	'mousedown',
	'mouseup',
	'mouseenter',
	'mouseleave',
	'mousemove',
	'mouseover',
	'mouseout',
];

const keyboardEvents = ['keydown', 'keyup', 'keypress'];

const focusEvents = ['focus', 'blur', 'focusin', 'focusout'];

const pointerEvents = [
	'pointerover',
	'pointerenter',
	'pointerdown',
	'pointermove',
	'pointerup',
	'pointercancel',
	'pointerout',
	'pointerleave',
	'gotpointercapture',
	'lostpointercapture',
];

const touchEvents = ['touchstart', 'touchend', 'touchmove', 'touchcancel'];

const wheelEvents = ['wheel', 'mousewheel', 'scroll'];

const mediaEvents = [
	'abort',
	'canplay',
	'canplaythrough',
	'durationchange',
	'emptied',
	'encrypted',
	'ended',
	'loadeddata',
	'loadedmetadata',
	'loadstart',
	'pause',
	'play',
	'playing',
	'progress',
	'ratechange',
	'seeked',
	'seeking',
	'stalled',
	'suspend',
	'timeupdate',
	'volumechange',
	'waiting',
];

const formEvents = ['change', 'input', 'submit', 'reset', 'focus', 'blur'];

const imageEvents = ['load', 'error'];

const animationEvents = [
	'animationstart',
	'animationend',
	'animationiteration',
];

const transitionEvents = ['transitionend'];

const compositionEvents = [
	'compositionstart',
	'compositionupdate',
	'compositionend',
];

const clipboardEvents = ['copy', 'cut', 'paste'];

const eventMap = {
	mouse: mouseEvents,
	keyboard: keyboardEvents,
	focus: focusEvents,
	pointer: pointerEvents,
	touch: touchEvents,
	wheel: wheelEvents,
	media: mediaEvents,
	form: formEvents,
	image: imageEvents,
	animation: animationEvents,
	transition: transitionEvents,
	composition: compositionEvents,
	clipboard: clipboardEvents,
	all: [
		...mouseEvents,
		...keyboardEvents,
		...focusEvents,
		...pointerEvents,
		...touchEvents,
		...wheelEvents,
		...mediaEvents,
		...formEvents,
		...imageEvents,
		...animationEvents,
		...transitionEvents,
		...compositionEvents,
		...clipboardEvents,
	],
};

type TypeArray = keyof typeof eventMap;

/**
 * Removes event listeners from a node.
 * @param props {DOMAttributes<T>} - The props containing the event listeners.
 * @param node {T | null} - The node to remove the event listeners from.
 * @param type {TypeArray} - The type of event listeners to remove.
 */
export const removeEventListeners = <T extends HTMLElement>(
	props: DOMAttributes<T>,
	node?: T | null,
	type: TypeArray = 'all',
) => {
	if (!node) return;

	const events = eventMap[type];

	for (const event of events) {
		try {
			node.removeEventListener(
				event,
				props[`on${event}` as keyof DOMAttributes<T>] as EventListener,
			);
		} catch (e) {
			console.warn(`Failed to remove event listener: ${event}`);
		}
	}
};
