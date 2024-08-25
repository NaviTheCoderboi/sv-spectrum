import './global.d.ts';

export { mergeIds } from './useId';
export { chain } from './chain';
export { getOwnerDocument, getOwnerWindow } from './domHelpers';
export { mergeProps } from './mergeProps';
export { focusWithoutScrolling } from './focusWithoutScrolling';
export { openLink } from './openLink';
export { runAfterTransition } from './runAfterTransition';
export { useGlobalListeners } from './useGlobalListeners.svelte';
export { useSyncRef } from './useSyncRef.svelte';
export { useDescription } from './useDescription.svelte';
export {
	isMac,
	isIPhone,
	isIPad,
	isIOS,
	isAppleDevice,
	isWebKit,
	isChrome,
	isAndroid,
	isFirefox,
} from './platform';
export { isVirtualClick, isVirtualPointerEvent } from './isVirtualEvent';
export { removeEventListeners } from './removeEventListeners';
export { isSSR } from './isSSR';
