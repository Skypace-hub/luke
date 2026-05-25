import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";
import {
	ensureDefaultTenantForUser,
	getDefaultTenantIdForUser,
	getServiceOpsSnapshot,
	userCanAccessTenant,
} from "../services/service-ops";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => "OK"),
	privateData: protectedProcedure.query(({ ctx }) => ({
		message: "This is private",
		user: ctx.session.user,
	})),
	serviceOps: router({
		snapshot: protectedProcedure
			.input(
				z
					.object({
						tenantId: z.string().min(1).optional(),
					})
					.optional()
			)
			.query(async ({ ctx, input }) => {
				const requestedTenantId =
					input?.tenantId ??
					(await getDefaultTenantIdForUser(ctx.session.user.id)) ??
					(await ensureDefaultTenantForUser(ctx.session.user));

				if (!requestedTenantId) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "No active tenant membership found",
					});
				}

				const canAccessTenant = await userCanAccessTenant(
					ctx.session.user.id,
					requestedTenantId
				);

				if (!canAccessTenant) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Tenant access denied",
					});
				}

				return getServiceOpsSnapshot(requestedTenantId);
			}),
	}),
});
export type AppRouter = typeof appRouter;
