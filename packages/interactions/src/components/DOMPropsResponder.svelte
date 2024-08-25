<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { DOMPropsResponderContext } from '../utils/DOMPropsContext';
	import type { HoverProps } from '../hooks/useHover.svelte';

	const {
		children,
		ref = $bindable(),
		...restProps
	}: HoverProps & {
		children: Snippet;
		ref?: Element;
	} = $props();

	let isRegistered = false;

	const context = {
		...restProps,
		ref,
		register: () => {
			isRegistered = true;
		},
	};

	onMount(() => {
		if (!isRegistered) {
			console.warn(
				'A DOMPropsResponder was ultilized without a hoverable DOM node.',
			);
		}
	});

	DOMPropsResponderContext.set(context);
</script>

{@render children()}
