/**
 * Check if the code is running on the server side.
 * @returns {boolean} True if the code is running on the server side.
 */
export const isSSR = () => {
	return typeof window === 'undefined';
};
