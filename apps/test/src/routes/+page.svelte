<script lang="ts">
	import { PressResponder, Pressable } from '@sv-aria/interactions';

	let ref = $state<HTMLButtonElement | null>(null);
</script>

<PressResponder onPress={() => alert('responding to child')}>
	<Pressable onPress={() => alert('pressed')} {ref}>
		{#snippet children(props)}
			<button {...props} bind:this={ref}> click me </button>
		{/snippet}
	</Pressable>
</PressResponder>

<style>
	button {
		background-color: #f43f5e;
		color: white;
		padding: 8px 16px;
		border-radius: 24px;
		border: none;
		cursor: pointer;
		outline: none;
		transition: all 0.2s;
	}

	button:hover {
		background-color: #e11d48;
		scale: 1.05;
	}
</style>
