"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

interface ThemeContextValue {
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: string) => void;
	theme: Theme;
}

const themeStorageKey = "theme";
const prefersDarkQuery = "(prefers-color-scheme: dark)";
const themeContext = createContext<ThemeContextValue>({
	resolvedTheme: "light",
	setTheme: () => undefined,
	theme: "system",
});

function isTheme(value: string | null): value is Theme {
	return value === "dark" || value === "light" || value === "system";
}

function getSystemTheme(): ResolvedTheme {
	return window.matchMedia(prefersDarkQuery).matches ? "dark" : "light";
}

function applyTheme(theme: ResolvedTheme) {
	const root = document.documentElement;

	root.classList.toggle("dark", theme === "dark");
	root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>("system");
	const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

	const updateTheme = useCallback((nextTheme: Theme) => {
		const nextResolvedTheme =
			nextTheme === "system" ? getSystemTheme() : nextTheme;

		setThemeState(nextTheme);
		setResolvedTheme(nextResolvedTheme);
		applyTheme(nextResolvedTheme);
	}, []);

	useEffect(() => {
		const storedTheme = window.localStorage.getItem(themeStorageKey);
		const initialTheme = isTheme(storedTheme) ? storedTheme : "system";

		updateTheme(initialTheme);
	}, [updateTheme]);

	useEffect(() => {
		const mediaQuery = window.matchMedia(prefersDarkQuery);
		const handleSystemThemeChange = () => {
			if (theme === "system") {
				updateTheme("system");
			}
		};

		mediaQuery.addEventListener("change", handleSystemThemeChange);

		return () => {
			mediaQuery.removeEventListener("change", handleSystemThemeChange);
		};
	}, [theme, updateTheme]);

	const setTheme = useCallback(
		(nextTheme: string) => {
			if (!isTheme(nextTheme)) {
				return;
			}

			window.localStorage.setItem(themeStorageKey, nextTheme);
			updateTheme(nextTheme);
		},
		[updateTheme]
	);

	const value = useMemo(
		() => ({ resolvedTheme, setTheme, theme }),
		[resolvedTheme, setTheme, theme]
	);

	return (
		<themeContext.Provider value={value}>{children}</themeContext.Provider>
	);
}

export function useAppTheme() {
	return useContext(themeContext);
}
