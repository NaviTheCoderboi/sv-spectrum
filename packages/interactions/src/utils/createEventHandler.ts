import type { BaseEvent } from '@sv-types/shared';

const getAllProperties = (obj: Record<any, any>): any[] => {
	const properties = new Set();
	let currentObj = obj;
	do {
		// biome-ignore lint/complexity/noForEach: <explanation>
		Object.getOwnPropertyNames(currentObj).forEach((prop) =>
			properties.add(prop),
		);
		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	} while ((currentObj = Object.getPrototypeOf(currentObj)));

	return Array.from(properties);
};

/**
 * This function wraps a= event handler to make stopPropagation the default, and support continuePropagation instead.
 */
export const createEventHandler = <T extends Event>(
	handler?: (e: BaseEvent<T>) => void,
): ((e: T) => void) | undefined => {
	if (!handler) {
		return undefined;
	}

	let shouldStopPropagation = true;

	return (e: T) => {
		const event: BaseEvent<T> = {
			...(Object.fromEntries(
				// @ts-expect-error - This is a hack to get all properties of the event
				getAllProperties(e).map((prop) => [prop, e[prop]]),
			) as T),
			preventDefault() {
				e.preventDefault();
			},
			isDefaultPrevented() {
				return e.defaultPrevented;
			},
			stopPropagation() {
				console.error(
					'stopPropagation is now the default behavior for events in sv-aria. You can use continuePropagation() to revert this behavior.',
				);
			},
			continuePropagation() {
				shouldStopPropagation = false;
			},
		};

		handler(event);

		if (shouldStopPropagation) {
			e.stopPropagation();
		}
	};
};
