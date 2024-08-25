<script lang="ts">
	import { PressResponderContext } from '../utils/context';
	import type { Snippet } from 'svelte';

	const context = {
		register: () => {},
	};

	PressResponderContext.set(context);

	const {
		children,
	}: {
		children: Snippet;
	} = $props();
</script>

{@render children()}
