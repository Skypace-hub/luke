"use client";

import type { AppLocale } from "@luke/i18n";
import { Toaster } from "@luke/ui/components/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { queryClient } from "@/utils/trpc";

import { I18nProvider, useI18n } from "./i18n-provider";
import { ThemeProvider, useAppTheme } from "./theme-provider";

const shouldShowQueryDevtools =
	process.env.NEXT_PUBLIC_QUERY_DEVTOOLS === "true";

export default function Providers({
	children,
	initialLocale,
}: {
	children: React.ReactNode;
	initialLocale: AppLocale;
}) {
	return (
		<I18nProvider initialLocale={initialLocale}>
			<ThemeProvider>
				<QueryClientProvider client={queryClient}>
					{children}
					{shouldShowQueryDevtools ? <ReactQueryDevtools /> : null}
				</QueryClientProvider>
				<LocalizedToaster />
			</ThemeProvider>
		</I18nProvider>
	);
}

function LocalizedToaster() {
	const { t } = useI18n();
	const { resolvedTheme } = useAppTheme();

	return (
		<Toaster
			containerAriaLabel={t("service.notifications")}
			position="top-right"
			richColors
			theme={resolvedTheme}
		/>
	);
}
