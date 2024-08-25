/**
 * a type that extends the native Event type to include the target and currentTarget properties
 */
export type STarget<
	E extends Event = Event,
	T extends HTMLElement = HTMLElement,
	C extends HTMLElement = T,
> = E & {
	target: (EventTarget & T) | null;
	currentTarget: (EventTarget & C) | null;
};
