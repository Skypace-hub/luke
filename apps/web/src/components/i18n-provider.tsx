"use client";

import {
	type AppLocale,
	defaultLocale,
	getTranslator,
	localeStorageKey,
	normalizeLocale,
	type Translate,
} from "@luke/i18n";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

interface I18nContextValue {
	locale: AppLocale;
	setLocale: (locale: AppLocale) => void;
	t: Translate;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
	children,
	initialLocale,
}: {
	children: ReactNode;
	initialLocale: AppLocale;
}) {
	const [locale, setLocaleState] = useState(initialLocale);

	useEffect(() => {
		const storedLocale = normalizeLocale(
			window.localStorage.getItem(localeStorageKey)
		);

		if (storedLocale && storedLocale !== locale) {
			setLocaleState(storedLocale);
		}
	}, [locale]);

	useEffect(() => {
		document.documentElement.lang = locale;
	}, [locale]);

	const setLocale = useCallback((nextLocale: AppLocale) => {
		setLocaleState(nextLocale);
		window.localStorage.setItem(localeStorageKey, nextLocale);
		fetch("/api/locale", {
			body: JSON.stringify({ locale: nextLocale }),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		}).catch(() => undefined);
	}, []);

	const value = useMemo(
		() => ({
			locale,
			setLocale,
			t: getTranslator(locale),
		}),
		[locale, setLocale]
	);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
	const context = useContext(I18nContext);

	if (!context) {
		return {
			locale: defaultLocale,
			setLocale: () => undefined,
			t: getTranslator(defaultLocale),
		};
	}

	return context;
}
