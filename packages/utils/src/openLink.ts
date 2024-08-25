import { focusWithoutScrolling } from './focusWithoutScrolling';
import { isFirefox, isIPad, isMac, isWebKit } from './platform';

interface Modifiers {
	metaKey?: boolean;
	ctrlKey?: boolean;
	altKey?: boolean;
	shiftKey?: boolean;
}

/**
 * Opens a link with the given modifiers.
 * @param target {HTMLAnchorElement} - The link to open.
 * @param modifiers {Modifiers} - The modifiers to use.
 * @param setOpening {boolean} - Whether the link is being opened.
 */
export const openLink = (
	target: HTMLAnchorElement,
	modifiers: Modifiers,
	setOpening = true,
) => {
	let { metaKey, ctrlKey } = modifiers;
	const { altKey, shiftKey } = modifiers;

	if (
		isFirefox() &&
		window.event?.type.startsWith('key') &&
		target.target === '_blank'
	) {
		if (isMac()) {
			metaKey = true;
		} else {
			ctrlKey = true;
		}
	}

	const event =
		isWebKit() && isMac() && !isIPad() && process.env.NODE_ENV !== 'test'
			? new KeyboardEvent('keydown', {
					keyIdentifier: 'Enter',
					metaKey,
					ctrlKey,
					altKey,
					shiftKey,
				})
			: new MouseEvent('click', {
					metaKey,
					ctrlKey,
					altKey,
					shiftKey,
					bubbles: true,
					cancelable: true,
				});

	(openLink as any).isOpening = setOpening;
	focusWithoutScrolling(target);
	target.dispatchEvent(event);
	(openLink as any).isOpening = false;
};

(openLink as any).isOpening = false;
