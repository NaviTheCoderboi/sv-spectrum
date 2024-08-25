const testUserAgent = (re: RegExp) => {
	if (typeof window === 'undefined') {
		return false;
	}
	return (
		window.navigator.userAgentData?.brands.some(
			(brand: { brand: string; version: string }) => re.test(brand.brand),
		) || re.test(window.navigator.userAgent)
	);
};

const testPlatform = (re: RegExp) =>
	typeof window !== 'undefined'
		? re.test(
				window.navigator.userAgentData?.platform ||
					window.navigator.platform,
			)
		: false;

const cached = (fn: () => boolean) => {
	if (process.env.NODE_ENV === 'test') {
		return fn;
	}

	let res: boolean | null = null;
	return () => {
		if (res == null) {
			res = fn();
		}
		return res;
	};
};

export const isMac = cached(() => testPlatform(/^Mac/i));

export const isIPhone = cached(() => testPlatform(/^iPhone/i));

export const isIPad = cached(
	() => testPlatform(/^iPad/i) || (isMac() && navigator.maxTouchPoints > 1),
);

export const isIOS = cached(() => isIPhone() || isIPad());

export const isAppleDevice = cached(() => isMac() || isIOS());

export const isWebKit = cached(
	() => testUserAgent(/AppleWebKit/i) && !isChrome(),
);

export const isChrome = cached(() => testUserAgent(/Chrome/i));

export const isAndroid = cached(() => testUserAgent(/Android/i));

export const isFirefox = cached(() => testUserAgent(/Firefox/i));
