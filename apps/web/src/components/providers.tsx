"use client";

import { Toaster } from "@luke/ui/components/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { queryClient } from "@/utils/trpc";

import { ThemeProvider } from "./theme-provider";

const shouldShowQueryDevtools =
	process.env.NEXT_PUBLIC_QUERY_DEVTOOLS === "true";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			disableTransitionOnChange
			enableSystem
		>
			<QueryClientProvider client={queryClient}>
				{children}
				{shouldShowQueryDevtools ? <ReactQueryDevtools /> : null}
			</QueryClientProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}
