<script lang="ts">
	import {
		PressResponder,
		Pressable,
	} from '../../../../packages/interactions/src';

	let ref = $state<HTMLElement | null>(null);
</script>

<PressResponder
	onPress={() => {
		console.log('pressed 1');
	}}
>
	<Pressable
		{ref}
		onPress={() => {
			console.log('pressed 2');
		}}
	>
		{#snippet children(props, isPressed)}
			<div
				{...props}
				style="width: 70px; height: 25px; background-color: {isPressed()
					? 'darkgreen'
					: 'green'};"
				bind:this={ref}
			>
				press me
			</div>
		{/snippet}
	</Pressable>
</PressResponder>
