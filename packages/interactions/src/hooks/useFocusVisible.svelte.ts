import {
	getOwnerDocument,
	getOwnerWindow,
	isMac,
	isVirtualClick,
	isSSR,
} from '@sv-aria/utils';
import type { APISchema } from '@sv-aria/docs-utils';

export const docs: APISchema = {
	props: {
		FocusVisbibleProps: {
			description:
				'Props for useFocusVisible hook, includes event handlers',
			type: 'FocusVisibleProps',
			required: false,
			default: '{}',
		},
	},
	returns: {
		isFocusVisible: {
			description: 'Function to check if keyboard focus is visible',
			type: '() => boolean',
		},
	},
};

export type Modality = 'keyboard' | 'pointer' | 'virtual';
type HandlerEvent =
	| PointerEvent
	| MouseEvent
	| KeyboardEvent
	| FocusEvent
	| null;
type Handler = (modality: Modality, e: HandlerEvent) => void;
export type FocusVisibleHandler = (isFocusVisible: boolean) => void;

export interface FocusVisibleProps {
	/** Whether the element is a text input. */
	isTextInput?: boolean;
	/** Whether the element will be auto focused. */
	autoFocus?: boolean;
}

export interface FocusVisibleResult {
	/** Whether keyboard focus is visible globally. */
	isFocusVisible: () => boolean;
}

let currentModality: null | Modality = null;
const changeHandlers = new Set<Handler>();
interface GlobalListenerData {
	focus: () => void;
}
export const hasSetupGlobalListeners = new Map<Window, GlobalListenerData>();
let hasEventBeforeFocus = false;
let hasBlurredWindowRecently = false;

const FOCUS_VISIBLE_INPUT_KEYS = {
	Tab: true,
	Escape: true,
};

const triggerChangeHandlers = (modality: Modality, e: HandlerEvent) => {
	for (const handler of changeHandlers) {
		handler(modality, e);
	}
};

/**
 * Helper function to determine if a KeyboardEvent is unmodified and could make keyboard focus styles visible.
 */
const isValidKey = (e: KeyboardEvent) => {
	return !(
		e.metaKey ||
		(!isMac() && e.altKey) ||
		e.ctrlKey ||
		e.key === 'Control' ||
		e.key === 'Shift' ||
		e.key === 'Meta'
	);
};

const handleKeyboardEvent = (e: KeyboardEvent) => {
	hasEventBeforeFocus = true;
	if (isValidKey(e)) {
		currentModality = 'keyboard';
		triggerChangeHandlers('keyboard', e);
	}
};

const handlePointerEvent = (e: PointerEvent | MouseEvent) => {
	currentModality = 'pointer';
	if (e.type === 'mousedown' || e.type === 'pointerdown') {
		hasEventBeforeFocus = true;
		triggerChangeHandlers('pointer', e);
	}
};

const handleClickEvent = (e: MouseEvent) => {
	if (isVirtualClick(e)) {
		hasEventBeforeFocus = true;
		currentModality = 'virtual';
	}
};

const handleFocusEvent = (e: FocusEvent) => {
	if (e.target === window || e.target === document) {
		return;
	}

	if (!hasEventBeforeFocus && !hasBlurredWindowRecently) {
		currentModality = 'virtual';
		triggerChangeHandlers('virtual', e);
	}

	hasEventBeforeFocus = false;
	hasBlurredWindowRecently = false;
};

const handleWindowBlur = () => {
	hasEventBeforeFocus = false;
	hasBlurredWindowRecently = true;
};

/**
 * Setup global event listeners to control when keyboard focus style should be visible.
 */
const setupGlobalFocusEvents = (element?: HTMLElement | null) => {
	if (
		typeof window === 'undefined' ||
		hasSetupGlobalListeners.get(getOwnerWindow(element))
	) {
		return;
	}

	const windowObject = getOwnerWindow(element);
	const documentObject = getOwnerDocument(element);

	const focus = windowObject.HTMLElement.prototype.focus;
	windowObject.HTMLElement.prototype.focus = function () {
		hasEventBeforeFocus = true;
		focus.apply(
			// biome-ignore lint/style/noArguments: <explanation>
			this,
			arguments as unknown as [options?: FocusOptions | undefined],
		);
	};

	documentObject.addEventListener('keydown', handleKeyboardEvent, true);
	documentObject.addEventListener('keyup', handleKeyboardEvent, true);
	documentObject.addEventListener('click', handleClickEvent, true);

	windowObject.addEventListener('focus', handleFocusEvent, true);
	windowObject.addEventListener('blur', handleWindowBlur, false);

	if (typeof PointerEvent !== 'undefined') {
		documentObject.addEventListener(
			'pointerdown',
			handlePointerEvent,
			true,
		);
		documentObject.addEventListener(
			'pointermove',
			handlePointerEvent,
			true,
		);
		documentObject.addEventListener('pointerup', handlePointerEvent, true);
	} else {
		documentObject.addEventListener('mousedown', handlePointerEvent, true);
		documentObject.addEventListener('mousemove', handlePointerEvent, true);
		documentObject.addEventListener('mouseup', handlePointerEvent, true);
	}

	windowObject.addEventListener(
		'beforeunload',
		() => {
			tearDownWindowFocusTracking(element);
		},
		{ once: true },
	);

	hasSetupGlobalListeners.set(windowObject, { focus });
};

const tearDownWindowFocusTracking = (
	element?: HTMLElement | null,
	loadListener?: () => void,
) => {
	const windowObject = getOwnerWindow(element);
	const documentObject = getOwnerDocument(element);
	if (loadListener) {
		documentObject.removeEventListener('DOMContentLoaded', loadListener);
	}
	if (!hasSetupGlobalListeners.has(windowObject)) {
		return;
	}
	windowObject.HTMLElement.prototype.focus =
		hasSetupGlobalListeners.get(windowObject)!.focus;

	documentObject.removeEventListener('keydown', handleKeyboardEvent, true);
	documentObject.removeEventListener('keyup', handleKeyboardEvent, true);
	documentObject.removeEventListener('click', handleClickEvent, true);
	windowObject.removeEventListener('focus', handleFocusEvent, true);
	windowObject.removeEventListener('blur', handleWindowBlur, false);

	if (typeof PointerEvent !== 'undefined') {
		documentObject.removeEventListener(
			'pointerdown',
			handlePointerEvent,
			true,
		);
		documentObject.removeEventListener(
			'pointermove',
			handlePointerEvent,
			true,
		);
		documentObject.removeEventListener(
			'pointerup',
			handlePointerEvent,
			true,
		);
	} else {
		documentObject.removeEventListener(
			'mousedown',
			handlePointerEvent,
			true,
		);
		documentObject.removeEventListener(
			'mousemove',
			handlePointerEvent,
			true,
		);
		documentObject.removeEventListener('mouseup', handlePointerEvent, true);
	}

	hasSetupGlobalListeners.delete(windowObject);
};

/**
 * EXPERIMENTAL
 * Adds a window (i.e. iframe) to the list of windows that are being tracked for focus visible.
 *
 * Sometimes apps render portions of their tree into an iframe. In this case, we cannot accurately track if the focus
 * is visible because we cannot see interactions inside the iframe. If you have this in your application's architecture,
 * then this function will attach event listeners inside the iframe. You should call `addWindowFocusTracking` with an
 * element from inside the window you wish to add. We'll retrieve the relevant elements based on that.
 * Note, you do not need to call this for the default window, as we call it for you.
 *
 * When you are ready to stop listening, but you do not wish to unmount the iframe, you may call the cleanup function
 * returned by `addWindowFocusTracking`. Otherwise, when you unmount the iframe, all listeners and state will be cleaned
 * up automatically for you.
 *
 * @param element @default document.body - The element provided will be used to get the window to add.
 * @returns A function to remove the event listeners and cleanup the state.
 */
export const addWindowFocusTracking = (
	element?: HTMLElement | null,
): (() => void) => {
	const documentObject = getOwnerDocument(element);
	let loadListener: () => void;
	if (documentObject.readyState !== 'loading') {
		setupGlobalFocusEvents(element);
	} else {
		loadListener = () => {
			setupGlobalFocusEvents(element);
		};
		documentObject.addEventListener('DOMContentLoaded', loadListener);
	}

	return () => {
		tearDownWindowFocusTracking(element, loadListener);
	};
};

if (!isSSR()) {
	addWindowFocusTracking();
}

/**
 * If true, keyboard focus is visible.
 */
export const isFocusVisible = (): boolean => {
	return currentModality !== 'pointer';
};

export const getInteractionModality = (): Modality | null => {
	return currentModality;
};

export const setInteractionModality = (modality: Modality) => {
	currentModality = modality;
	triggerChangeHandlers(modality, null);
};

/**
 * Keeps state of the current modality.
 */
export const useInteractionModality = (): Modality | null => {
	setupGlobalFocusEvents();

	let modality = $state(currentModality);
	$effect(() => {
		const handler = () => {
			modality = currentModality;
		};

		changeHandlers.add(handler);
		return () => {
			changeHandlers.delete(handler);
		};
	});

	return isSSR() ? null : modality;
};

const nonTextInputTypes = new Set([
	'checkbox',
	'radio',
	'range',
	'color',
	'file',
	'image',
	'button',
	'submit',
	'reset',
]);

/**
 * If this is attached to text input component, return if the event is a focus event (Tab/Escape keys pressed) so that
 * focus visible style can be properly set.
 */
const isKeyboardFocusEvent = (
	isTextInput: boolean,
	modality: Modality,
	e: HandlerEvent,
) => {
	const IHTMLInputElement =
		typeof window !== 'undefined'
			? getOwnerWindow(e?.target as Element).HTMLInputElement
			: HTMLInputElement;
	const IHTMLTextAreaElement =
		typeof window !== 'undefined'
			? getOwnerWindow(e?.target as Element).HTMLTextAreaElement
			: HTMLTextAreaElement;
	const IHTMLElement =
		typeof window !== 'undefined'
			? getOwnerWindow(e?.target as Element).HTMLElement
			: HTMLElement;
	const IKeyboardEvent =
		typeof window !== 'undefined'
			? getOwnerWindow(e?.target as Element).KeyboardEvent
			: KeyboardEvent;

	isTextInput =
		isTextInput ||
		(e?.target instanceof IHTMLInputElement &&
			!nonTextInputTypes.has(e.target.type)) ||
		e?.target instanceof IHTMLTextAreaElement ||
		(e?.target instanceof IHTMLElement && e.target.isContentEditable);
	return !(
		isTextInput &&
		modality === 'keyboard' &&
		e instanceof IKeyboardEvent &&
		!FOCUS_VISIBLE_INPUT_KEYS[
			e.key as keyof typeof FOCUS_VISIBLE_INPUT_KEYS
		]
	);
};

/**
 * Manages focus visible state for the page, and subscribes individual components for updates.
 */
export const useFocusVisible = (
	props: FocusVisibleProps = {},
): FocusVisibleResult => {
	const { isTextInput, autoFocus } = props;
	let isFocusVisibleState = $state(autoFocus || isFocusVisible());
	useFocusVisibleListener(
		(isFocusVisible) => {
			isFocusVisibleState = isFocusVisible;
		},
		{ isTextInput },
	);

	return {
		isFocusVisible: () => isFocusVisibleState,
	};
};

/**
 * Listens for trigger change and reports if focus is visible (i.e., modality is not pointer).
 */
export const useFocusVisibleListener = (
	fn: FocusVisibleHandler,
	opts?: { isTextInput?: boolean },
): void => {
	setupGlobalFocusEvents();

	$effect(() => {
		const handler = (modality: Modality, e: HandlerEvent) => {
			if (!isKeyboardFocusEvent(!!opts?.isTextInput, modality, e)) {
				return;
			}
			fn(isFocusVisible());
		};
		changeHandlers.add(handler);
		return () => {
			changeHandlers.delete(handler);
		};
	});
};
