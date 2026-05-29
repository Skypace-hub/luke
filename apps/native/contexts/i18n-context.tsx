import {
	type AppLocale,
	defaultLocale,
	getTranslator,
	localeStorageKey,
	normalizeLocale,
	type Translate,
} from "@luke/i18n";
import { getItemAsync, setItemAsync } from "expo-secure-store";
import {
	createContext,
	type PropsWithChildren,
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

const getDeviceLocale = () => {
	try {
		return (
			normalizeLocale(Intl.DateTimeFormat().resolvedOptions().locale) ??
			defaultLocale
		);
	} catch {
		return defaultLocale;
	}
};

export function I18nProvider({ children }: PropsWithChildren) {
	const [locale, setLocaleState] = useState<AppLocale>(getDeviceLocale);

	useEffect(() => {
		let isMounted = true;

		getItemAsync(localeStorageKey)
			.then((storedLocale) => {
				const normalizedLocale = normalizeLocale(storedLocale);

				if (isMounted && normalizedLocale) {
					setLocaleState(normalizedLocale);
				}
			})
			.catch(() => undefined);

		return () => {
			isMounted = false;
		};
	}, []);

	const setLocale = useCallback((nextLocale: AppLocale) => {
		setLocaleState(nextLocale);
		setItemAsync(localeStorageKey, nextLocale).catch(() => undefined);
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
		throw new Error("useI18n must be used within I18nProvider");
	}

	return context;
}
