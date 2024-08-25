import type { AriaLabelingProps } from '@sv-types/shared';
import { onMount } from 'svelte';

let descriptionId = 0;
const descriptionNodes = new Map<
	string,
	{ refCount: number; element: Element }
>();

/**
 * A hook that returns the props to add to an element to reference a hidden description element.
 * @param description - The description to reference.
 * @returns {AriaLabelingProps} - The props to add to the element.
 */
export const useDescription = (description?: string): AriaLabelingProps => {
	let id: string | undefined = undefined;

	onMount(() => {
		if (!description) {
			return;
		}

		let desc = descriptionNodes.get(description);
		if (!desc) {
			const _id = `sv-aria-description-${String(descriptionId++)}`;
			id = _id;

			const node = document.createElement('div');
			node.id = id;
			node.style.display = 'none';
			node.textContent = description;
			document.body.appendChild(node);
			desc = { refCount: 0, element: node };
			descriptionNodes.set(description, desc);
		} else {
			id = desc.element.id;
		}

		desc.refCount++;

		return () => {
			if (--desc.refCount === 0) {
				desc.element.remove();
				descriptionNodes.delete(description);
			}
		};
	});

	return {
		'aria-describedby': description ? id : undefined,
	};
};
