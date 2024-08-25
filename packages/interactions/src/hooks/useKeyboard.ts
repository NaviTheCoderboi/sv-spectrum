import { createEventHandler } from '../utils/createEventHandler';
import type { DOMAttributes, KeyboardEvents } from '@sv-types/shared';

export const docs = {
	props: {
		keyboardProps: {
			description: 'Props for useKeyboard hook, includes event handlers',
			type: 'KeyboardProps',
			required: false,
			default: '{}',
		},
	},
	returns: {
		keyboardProps: {
			description: 'Props to spread onto the target element',
			type: 'DOMAttributes<T>',
		},
	},
	events: {
		onKeyDown: {
			description: 'Handler that is called when a key is pressed',
			type: '(e: SKeyboardEvent) => void',
		},
		onKeyUp: {
			description: 'Handler that is called when a key is released',
			type: '(e: SKeyboardEvent) => void',
		},
	},
};

export interface KeyboardProps extends KeyboardEvents {
	/** Whether the keyboard events should be disabled. */
	isDisabled?: boolean;
}

export interface KeyboardResult<T extends HTMLElement = HTMLElement> {
	/** Props to spread onto the target element. */
	keyboardProps: DOMAttributes<T>;
}

/**
 * Handles keyboard interactions for a focusable element.
 */
export const useKeyboard = <T extends HTMLElement = HTMLElement>(
	props: KeyboardProps = {},
): KeyboardResult<T> => {
	return {
		keyboardProps: props.isDisabled
			? {}
			: {
					onkeydown: createEventHandler(props.onKeyDown),
					onkeyup: createEventHandler(props.onKeyUp),
				},
	};
};
