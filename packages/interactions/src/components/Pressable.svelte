<script lang="ts">
	import { usePress, type PressProps } from '../hooks/usePress.svelte';
	import type { Snippet } from 'svelte';
	import type { DOMAttributes, FocusableElement } from '@sv-types/shared';

	const {
		children,
		ref = $bindable(),
		...props
	}: PressProps & {
		children: Snippet<[PressProps & DOMAttributes, () => boolean]>;
		ref?: FocusableElement | null;
	} = $props();

	const { isPressed, pressProps } = usePress({ ...props, ref });
</script>

{@render children(pressProps, isPressed)}
