import {
	useDOMPropsResponderContext,
	type DOMPropsResponderProps,
} from '../utils/DOMPropsContext';

export const useDOMPropsResponder = (ref: Element | null) => {
	const domProps = useDOMPropsResponderContext({ ref }) || {};

	const { register, isDisabled, onPress, ...partialDomProps } =
		domProps as DOMPropsResponderProps & {
			onPress?: () => void;
			isDisabled?: boolean;
			register: () => void;
		};

	return {
		contextProps: partialDomProps,
	};
};
