import type { AppRouter } from "@luke/api/routers/index";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

import { getServiceOpsQueryError } from "@/lib/business-errors";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			const businessError = getServiceOpsQueryError(error.message);

			toast.error(businessError.title, {
				action: {
					label: "retry",
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
