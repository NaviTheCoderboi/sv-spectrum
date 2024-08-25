import type { DOMAttributes } from '@sv-types/shared';
import { mergeProps, useSyncRef } from '@sv-aria/utils';
import { createContext } from 'svelte-contextify';

export interface DOMPropsResponderProps extends DOMAttributes {
	ref?: Element | null;
}

interface IDOMPropsResponderContext extends DOMAttributes {
	register: () => void;
	ref?: Element | null;
}

export const DOMPropsResponderContext =
	createContext<IDOMPropsResponderContext | null>({
		defaultValue: null,
	});

export const useDOMPropsResponderContext = (
	props: DOMPropsResponderProps,
): DOMPropsResponderProps => {
	const context = DOMPropsResponderContext.get();

	if (context) {
		const { register, ...contextProps } = context;
		props = mergeProps(contextProps, props);
		register();
	}

	useSyncRef(DOMPropsResponderContext, props.ref);

	return props;
};
