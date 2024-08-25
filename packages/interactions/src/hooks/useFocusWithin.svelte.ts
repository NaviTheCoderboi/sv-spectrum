import type {
	DOMAttributes,
	SFocusEvent,
	FocusableElement,
} from '@sv-types/shared';
import { useBlurEvent } from '../utils/utils.svelte';
import type { APISchema } from '@sv-aria/docs-utils';

export const docs: APISchema = {
	props: {
		focusWithinProps: {
			description:
				'Props for useFocusWithin hook, includes event handlers',
			type: 'FocusWithinProps<T, R>',
			required: false,
			default: '{}',
		},
	},
	returns: {
		isFocusWithin: {
			description:
				'Function to check if the element or a descendant is currently focused',
			type: '() => boolean',
		},
		focusWithinProps: {
			description: 'Props to spread onto the target element',
			type: 'DOMAttributes<T>',
		},
	},
	events: {
		onFocusWithin: {
			description:
				'Handler that is called when the target element or a descendant receives focus',
			type: '(e: SFocusEvent<T, R>) => void',
		},
		onBlurWithin: {
			description:
				'Handler that is called when the target element and all descendants lose focus',
			type: '(e: SFocusEvent<T, R>) => void',
		},
		onFocusWithinChange: {
			description:
				'Handler that is called when the the focus within state changes',
			type: '(isFocusWithin: boolean) => void',
		},
	},
};

export interface FocusWithinProps<
	T extends FocusableElement = FocusableElement,
	R extends HTMLElement = HTMLElement,
> {
	/** Whether the focus within events should be disabled. */
	isDisabled?: boolean;
	/** Handler that is called when the target element or a descendant receives focus. */
	onFocusWithin?: (e: SFocusEvent<T, R>) => void;
	/** Handler that is called when the target element and all descendants lose focus. */
	onBlurWithin?: (e: SFocusEvent<T, R>) => void;
	/** Handler that is called when the the focus within state changes. */
	onFocusWithinChange?: (isFocusWithin: boolean) => void;
}

export interface FocusWithinResult<
	T extends FocusableElement = FocusableElement,
> {
	/** Props to spread onto the target element. */
	focusWithinProps: DOMAttributes<T>;
	isFocusWithin: () => boolean;
}

/**
 * Handles focus events for the target and its descendants.
 */
export const useFocusWithin = <
	T extends FocusableElement = FocusableElement,
	R extends HTMLElement = HTMLElement,
>(
	props: FocusWithinProps<T, R> = {},
): FocusWithinResult<T> => {
	const { isDisabled, onBlurWithin, onFocusWithin, onFocusWithinChange } =
		props;

	let isFocusWithin = $state(false);

	const onBlur = (e: FocusEvent) => {
		if (
			isFocusWithin &&
			!(e.currentTarget as Element).contains(e.relatedTarget as Element)
		) {
			isFocusWithin = false;

			if (onBlurWithin) {
				onBlurWithin(e as SFocusEvent<T, R>);
			}

			if (onFocusWithinChange) {
				onFocusWithinChange(false);
			}
		}
	};

	const _onFocus = useBlurEvent(onBlur);

	const onFocus = (e: FocusEvent) => {
		if (!isFocusWithin && document.activeElement === e.target) {
			if (onFocusWithin) {
				onFocusWithin(e as SFocusEvent<T, R>);
			}

			if (onFocusWithinChange) {
				onFocusWithinChange(true);
			}

			isFocusWithin = true;
			_onFocus.handler(e as SFocusEvent<T, R>);
		}
	};

	if (isDisabled) {
		return {
			focusWithinProps: {
				onfocusin: undefined,
				onfocusout: undefined,
			},
			isFocusWithin: () => false,
		};
	}

	return {
		focusWithinProps: {
			onfocusin: onFocus,
			onfocusout: onBlur,
		},
		isFocusWithin: () => isFocusWithin,
	};
};
