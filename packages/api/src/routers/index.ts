import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";
import {
	createAsset,
	createContract,
	createEngineer,
	createFault,
	createHospital,
	createJob,
	createPart,
	createProduct,
	deleteAsset,
	deleteContract,
	deleteEngineer,
	deleteFault,
	deleteHospital,
	deleteJob,
	deletePart,
	deleteProduct,
	ensureDefaultTenantForUser,
	getDefaultTenantIdForUser,
	getServiceOpsSnapshot,
	updateAsset,
	updateContract,
	updateEngineer,
	updateFault,
	updateHospital,
	updateJob,
	updatePart,
	updateProduct,
	userCanAccessTenant,
} from "../services/service-ops";

const optionalTextSchema = z
	.string()
	.trim()
	.optional()
	.nullable()
	.transform((value) => value || null);

const tenantInputSchema = z.object({
	tenantId: z.string().min(1),
});

const idSchema = z.object({
	id: z.string().min(1),
	tenantId: z.string().min(1),
});

const hospitalSchema = z.object({
	address: optionalTextSchema,
	code: z.string().trim().min(1),
	district: z.string().trim().min(1),
	latitude: z.number().nullable().optional(),
	longitude: z.number().nullable().optional(),
	name: z.string().trim().min(1),
	primaryContactEmail: optionalTextSchema,
	primaryContactName: optionalTextSchema,
	primaryContactPhone: optionalTextSchema,
});

const engineerSchema = z.object({
	code: z.string().trim().min(1),
	email: optionalTextSchema,
	grade: z.string().trim().min(1),
	hourlyRate: z.number().min(0),
	mealCap: z.number().min(0),
	mileageRate: z.number().min(0),
	name: z.string().trim().min(1),
	phone: optionalTextSchema,
	region: z.string().trim().min(1),
	status: z.enum([
		"on_site",
		"in_transit",
		"idle",
		"timer_anomaly",
		"off_duty",
	]),
});

const productSchema = z.object({
	category: z.string().trim().min(1),
	code: z.string().trim().min(1),
	defaultPmCycleMonths: z.number().int().min(1),
	isEngineerReadOnly: z.boolean(),
	manufacturer: z.string().trim().min(1),
	modelName: z.string().trim().min(1),
});

const partSchema = z.object({
	minimumStock: z.number().int().min(0),
	name: z.string().trim().min(1),
	partNumber: z.string().trim().min(1),
	stockOnHand: z.number().int().min(0),
	supplier: z.string().trim().min(1),
	unitCost: z.number().min(0),
});

const assetSchema = z.object({
	assetNumber: z.string().trim().min(1),
	contractCoverageStatus: z.enum([
		"in_contract",
		"out_of_contract",
		"billable_exception",
		"expired",
	]),
	designatedEngineerId: optionalTextSchema,
	hospitalId: z.string().min(1),
	installationDate: optionalTextSchema,
	locationLabel: z.string().trim().min(1),
	nextPmDueDate: optionalTextSchema,
	nfcUid: z.string().trim().min(1),
	productModelId: z.string().min(1),
	serialNumber: z.string().trim().min(1),
	warrantyExpiryDate: optionalTextSchema,
});

const jobSchema = z.object({
	assetId: z.string().min(1),
	assignedEngineerId: optionalTextSchema,
	description: z.string().trim().min(1),
	hospitalId: z.string().min(1),
	jobNumber: z.string().trim().min(1),
	priority: z.enum(["normal", "urgent"]),
	scheduledStartAt: optionalTextSchema,
	status: z.enum([
		"created",
		"assigned",
		"in_progress",
		"paused",
		"resumed",
		"completed",
		"timer_anomaly",
		"cancelled",
	]),
	type: z.enum(["installation", "repair", "preventive_maintenance"]),
});

const contractSchema = z.object({
	accountManagerName: z.string().trim().min(1),
	contractNumber: z.string().trim().min(1),
	coveredModelIds: z.array(z.string().min(1)),
	endDate: z.string().trim().min(1),
	hospitalId: z.string().min(1),
	responseSlaHours: z.number().int().min(1),
	startDate: z.string().trim().min(1),
	status: z.enum(["active", "expiring", "expired"]),
	type: z.enum(["full", "partial", "emergency_only"]),
});

const faultSchema = z.object({
	assetId: optionalTextSchema,
	description: z.string().trim().min(1),
	hospitalId: z.string().min(1),
	reportNumber: z.string().trim().min(1),
	severity: z.enum(["low", "medium", "high", "critical"]),
	status: z.enum(["received", "engineer_assigned", "in_progress", "resolved"]),
	submittedByContact: optionalTextSchema,
	submittedByName: z.string().trim().min(1),
});

const mutationResponse = { ok: true } as const;

const ensureTenantAccess = async (userId: string, tenantId: string) => {
	const canAccessTenant = await userCanAccessTenant(userId, tenantId);

	if (!canAccessTenant) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Tenant access denied",
		});
	}
};

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

				await ensureTenantAccess(ctx.session.user.id, requestedTenantId);

				return getServiceOpsSnapshot(requestedTenantId);
			}),
		createHospital: protectedProcedure
			.input(tenantInputSchema.extend({ data: hospitalSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await createHospital(input.tenantId, input.data);
				return mutationResponse;
			}),
		updateHospital: protectedProcedure
			.input(idSchema.extend({ data: hospitalSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await updateHospital(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		deleteHospital: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await deleteHospital(input.tenantId, input.id);
				return mutationResponse;
			}),
		createEngineer: protectedProcedure
			.input(tenantInputSchema.extend({ data: engineerSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await createEngineer(input.tenantId, input.data);
				return mutationResponse;
			}),
		updateEngineer: protectedProcedure
			.input(idSchema.extend({ data: engineerSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await updateEngineer(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		deleteEngineer: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await deleteEngineer(input.tenantId, input.id);
				return mutationResponse;
			}),
		createProduct: protectedProcedure
			.input(tenantInputSchema.extend({ data: productSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await createProduct(input.tenantId, input.data);
				return mutationResponse;
			}),
		updateProduct: protectedProcedure
			.input(idSchema.extend({ data: productSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await updateProduct(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		deleteProduct: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await deleteProduct(input.tenantId, input.id);
				return mutationResponse;
			}),
		createPart: protectedProcedure
			.input(tenantInputSchema.extend({ data: partSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await createPart(input.tenantId, input.data);
				return mutationResponse;
			}),
		updatePart: protectedProcedure
			.input(idSchema.extend({ data: partSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await updatePart(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		deletePart: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await deletePart(input.tenantId, input.id);
				return mutationResponse;
			}),
		createAsset: protectedProcedure
			.input(tenantInputSchema.extend({ data: assetSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await createAsset(input.tenantId, input.data);
				return mutationResponse;
			}),
		updateAsset: protectedProcedure
			.input(idSchema.extend({ data: assetSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await updateAsset(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		deleteAsset: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await deleteAsset(input.tenantId, input.id);
				return mutationResponse;
			}),
		createJob: protectedProcedure
			.input(tenantInputSchema.extend({ data: jobSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await createJob(input.tenantId, ctx.session.user.id, input.data);
				return mutationResponse;
			}),
		updateJob: protectedProcedure
			.input(idSchema.extend({ data: jobSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await updateJob(
					input.tenantId,
					ctx.session.user.id,
					input.id,
					input.data
				);
				return mutationResponse;
			}),
		deleteJob: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await deleteJob(input.tenantId, input.id);
				return mutationResponse;
			}),
		createContract: protectedProcedure
			.input(tenantInputSchema.extend({ data: contractSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await createContract(input.tenantId, input.data);
				return mutationResponse;
			}),
		updateContract: protectedProcedure
			.input(idSchema.extend({ data: contractSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await updateContract(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		deleteContract: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await deleteContract(input.tenantId, input.id);
				return mutationResponse;
			}),
		createFault: protectedProcedure
			.input(tenantInputSchema.extend({ data: faultSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await createFault(input.tenantId, input.data);
				return mutationResponse;
			}),
		updateFault: protectedProcedure
			.input(idSchema.extend({ data: faultSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await updateFault(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		deleteFault: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId);
				await deleteFault(input.tenantId, input.id);
				return mutationResponse;
			}),
	}),
});
export type AppRouter = typeof appRouter;
