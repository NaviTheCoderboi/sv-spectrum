import { useBlurEvent } from '../utils/utils.svelte';
import { getOwnerDocument } from '@sv-aria/utils';
import type {
	DOMAttributes,
	FocusableElement,
	FocusEvents,
	SFocusEvent,
} from '@sv-types/shared';
import type { FocusEventHandler } from 'svelte/elements';

export const docs = {
	props: {
		focusProps: {
			description: 'Props for useFocus hook, includes event handlers',
			type: 'FocusProps<T, R>',
			required: false,
			default: '{}',
		},
	},
	returns: {
		isFocused: {
			description:
				'Function to check if the element is currently focused',
			type: '() => boolean',
		},
		focusProps: {
			description: 'Props to spread onto the target element',
			type: 'DOMAttributes<T>',
		},
	},
	events: {
		onFocus: {
			description:
				'Handler that is called when the element receives focus',
			type: '(e: SFocusEvent<T, R>) => void',
		},
		onBlur: {
			description: 'Handler that is called when the element loses focus',
			type: '(e: SFocusEvent<T, R>) => void',
		},
		onFocusChange: {
			description:
				"Handler that is called when the element's focus status changes",
			type: '(isFocused: boolean) => void',
		},
	},
};

export interface FocusProps<
	T extends FocusableElement = FocusableElement,
	R extends HTMLElement = HTMLElement,
> extends FocusEvents<T, R> {
	/** Whether the focus events should be disabled. */
	isDisabled?: boolean;
}

export interface FocusResult<T extends FocusableElement = FocusableElement> {
	/** Props to spread onto the target element. */
	focusProps: DOMAttributes<T>;
	/** Whether the element is currently focused. */
	isFocused: () => boolean;
}

/**
 * Handles focus events for the immediate target.
 * Focus events on child elements will be ignored.
 * @param props - The props for the hook.
 * @returns The props to spread on the target element.
 */
export const useFocus = <
	T extends FocusableElement = FocusableElement,
	R extends HTMLElement = HTMLElement,
>(
	props: FocusProps<T, R> = {},
): FocusResult<T> => {
	const {
		isDisabled,
		onFocus: onFocusProp,
		onBlur: onBlurProp,
		onFocusChange,
	} = props;

	const onBlur: FocusProps<T, R>['onBlur'] = (e: SFocusEvent<T, R>) => {
		if (e.target === e.currentTarget) {
			if (onBlurProp) {
				onBlurProp(e);
			}

			if (onFocusChange) {
				onFocusChange(false);
			}

			return true;
		}
	};

	const { handler: _onFocus, isFocused } = useBlurEvent<T, R>(onBlur);

	const onFocus: FocusProps<T, R>['onFocus'] = (e: SFocusEvent<T, R>) => {
		const ownerDocument = getOwnerDocument(e.target);

		if (
			e.target === e.currentTarget &&
			ownerDocument.activeElement === e.target
		) {
			if (onFocusProp) {
				onFocusProp(e);
			}

			if (onFocusChange) {
				onFocusChange(true);
			}

			_onFocus(e);
		}
	};

	return {
		focusProps: {
			onfocus:
				!isDisabled && (onFocusProp || onFocusChange || onBlurProp)
					? (onFocus as unknown as FocusEventHandler<T>)
					: undefined,
			onblur:
				!isDisabled && (onBlurProp || onFocusChange)
					? (onBlur as unknown as FocusEventHandler<T>)
					: undefined,
		},
		isFocused: () => isFocused(),
	};
};
