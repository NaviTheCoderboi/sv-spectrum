<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { PressResponderContext } from '../utils/context';
	import { mergeProps, useSyncRef } from '@sv-aria/utils';
	import type { PressProps } from '../hooks/usePress.svelte';
	import type { FocusableElement } from '@sv-types/shared';

	let {
		children,
		ref = $bindable(),
		...props
	}: PressProps & {
		children: Snippet;
		ref?: FocusableElement;
	} = $props();

	let isRegistered = $state(false);
	const prevContext = PressResponderContext.get();

	ref = ref ?? prevContext?.ref;

	const context = mergeProps(prevContext ?? {}, {
		...props,
		ref,
		register: () => {
			isRegistered = true;
			if (prevContext) {
				prevContext.register();
			}
		},
	});

	useSyncRef(PressResponderContext, ref);

	onMount(() => {
		if (!isRegistered) {
			console.warn(
				'A PressResponder was rendered without a pressable child. ' +
					'Either call the usePress hook, or wrap your DOM node with <Pressable> component.',
			);
			isRegistered = true;
		}
	});

	PressResponderContext.set(context);
</script>

{@render children()}
