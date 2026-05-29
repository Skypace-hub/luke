import type { AppRouter } from "@luke/api/routers/index";
import { defaultLocale, getTranslator } from "@luke/i18n";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

import { getServiceOpsQueryError } from "@/lib/business-errors";

const t = getTranslator(defaultLocale);

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			const businessError = getServiceOpsQueryError(error.message, t);

			toast.error(businessError.title, {
				action: {
					label: t("common.retry"),
					onClick: query.invalidate,
				},
				description: businessError.description,
			});
		},
	}),
});

const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: "/api/trpc",
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: "include",
				});
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
