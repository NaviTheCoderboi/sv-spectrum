import type {
	AriaAttributes,
	AriaRole,
	DOMAttributes as SDOMAttributes,
} from 'svelte/elements';

/** Any focusable element, including both HTML and SVG elements. */
export interface FocusableElement extends Element, HTMLOrSVGElement {}

/** All DOM attributes supported across both HTML and SVG elements. */
export interface DOMAttributes<T extends FocusableElement = FocusableElement>
	extends AriaAttributes,
		SDOMAttributes<T> {
	id?: string | undefined;
	role?: AriaRole | undefined;
	tabindex?: number | undefined;
	style?: string | undefined;
	class?: string | undefined;
}

export interface AriaLabelingProps {
	/**
	 * Defines a string value that labels the current element.
	 */
	'aria-label'?: string;

	/**
	 * Identifies the element (or elements) that labels the current element.
	 */
	'aria-labelledby'?: string;

	/**
	 * Identifies the element (or elements) that describes the object.
	 */
	'aria-describedby'?: string;

	/**
	 * Identifies the element (or elements) that provide a detailed, extended description for the object.
	 */
	'aria-details'?: string;
}
