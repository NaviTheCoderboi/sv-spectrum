/**
 * Get the owner document of the element
 * @param {Element | null | undefined} el - The element to get the owner document from
 * @returns {Document} The owner document
 */
export const getOwnerDocument = (el: Element | null | undefined): Document => {
	return el?.ownerDocument ?? document;
};

/**
 * Get the owner window of the element
 * @param {Window | Element | null | undefined} el - The element to get the owner window from
 * @returns {Window & typeof global} The owner window
 */
export const getOwnerWindow = (
	el: (Window & typeof global) | Element | null | undefined,
): Window & typeof global => {
	if (el && 'window' in el && el.window === el) {
		return el;
	}

	const doc = getOwnerDocument(el as Element | null | undefined);
	return doc.defaultView || window;
};
