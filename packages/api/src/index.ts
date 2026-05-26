import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context";
import { isTechnicalErrorMessage } from "./error-format";

export const t = initTRPC.context<Context>().create({
	errorFormatter({ error, shape }) {
		const shouldHideMessage =
			error.code === "INTERNAL_SERVER_ERROR" &&
			isTechnicalErrorMessage(error.message);

		if (!shouldHideMessage) {
			return shape;
		}

		return {
			...shape,
			message: "Request failed.",
		};
	},
});

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});
