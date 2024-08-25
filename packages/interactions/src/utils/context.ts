import type { FocusableElement } from '@sv-types/shared';
import type { PressProps } from '../hooks/usePress.svelte';
import { createContext } from 'svelte-contextify';

interface IPressResponderContext<T extends FocusableElement = FocusableElement>
	extends PressProps<T> {
	register(): void;
	ref?: FocusableElement;
}

export const PressResponderContext = createContext<IPressResponderContext>({
	defaultValue: {
		register: () => {},
	},
});
