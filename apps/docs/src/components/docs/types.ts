export type Obj<T, O> = {
	[K in keyof T]-?: O;
};

export interface PropSchema {
	default?: string;
	type: string;
	description: string;
	required?: boolean;
}

export interface EventSchema {
	type: string;
	description: string;
}

export interface BaseSchema {
	description: string;
	type: string;
}

export interface APISchema<T = Record<string, unknown>> {
	props: Obj<T, PropSchema>;
	events?: Obj<T, EventSchema>;
	returns: Obj<T, BaseSchema>;
	other?: {
		[key: string]: Obj<T, BaseSchema>;
	};
}
