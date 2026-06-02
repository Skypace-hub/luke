import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import {
	addJobPartUsage,
	approvePmOpportunity,
	askServiceManualQuestion,
	clockEngineer,
	commissionAssetNfcTag,
	confirmPartsArrived,
	convertFaultToRepairJob,
	createAsset,
	createContract,
	createEngineer,
	createFault,
	createHospital,
	createJob,
	createPart,
	createProduct,
	createTenantForUser,
	createTenantUser,
	deleteAsset,
	deleteContract,
	deleteEngineer,
	deleteFault,
	deleteHospital,
	deleteJob,
	deletePart,
	deleteProduct,
	deleteTenant,
	deleteTenantUser,
	endJobWithNfc,
	ensureDefaultTenantForUser,
	generateOperationalReportSnapshot,
	getDefaultTenantIdForUser,
	getNfcDeviceInfo,
	getServiceOpsSnapshot,
	getTenantAccessPolicy,
	logJobExpense,
	recalculateJobCost,
	recordEngineerLocation,
	refreshContractStatuses,
	replaceAssetNfcTag,
	reportPartsShortage,
	reportTimerAnomaly,
	resumeShortageJob,
	startJobWithNfc,
	transitionJob,
	updateAsset,
	updateContract,
	updateEngineer,
	updateFault,
	updateHospital,
	updateJob,
	updatePart,
	updateProduct,
	updateProductParts,
	updateSystemParameter,
	updateTenant,
	updateTenantUser,
	uploadServiceManualMetadata,
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

const tenantSchema = z.object({
	id: optionalTextSchema,
	isActive: z.boolean(),
	name: z.string().trim().min(1),
	region: z.string().trim().min(1),
	releaseLabel: z.string().trim().min(1),
});

const tenantUserSchema = z.object({
	email: z.email(),
	name: z.string().trim().min(1),
	password: optionalTextSchema,
	role: z.enum(["tenant_admin", "operator", "observer"]),
	status: z.enum(["active", "invited", "suspended"]),
});

const hospitalSchema = z.object({
	address: optionalTextSchema,
	code: z.string().trim().min(1),
	district: z.string().trim().min(1),
	latitude: z.number().min(-90).max(90).nullable().optional(),
	longitude: z.number().min(-180).max(180).nullable().optional(),
	name: z.string().trim().min(1),
	primaryContactEmail: optionalTextSchema,
	primaryContactName: optionalTextSchema,
	primaryContactPhone: optionalTextSchema,
	regionProvince: optionalTextSchema,
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

const serviceManualSchema = z.object({
	fileName: z.string().trim().min(1),
	fileUrl: z.string().trim().min(1),
	pageCount: z.number().int().min(1).nullable().optional(),
	storageKey: optionalTextSchema,
	version: optionalTextSchema,
});

const productSchema = z.object({
	category: z.string().trim().min(1),
	code: z.string().trim().min(1),
	defaultPmCycleMonths: z.number().int().min(1),
	description: optionalTextSchema,
	isEngineerReadOnly: z.boolean(),
	listPrice: z.number().min(0),
	manufacturer: z.string().trim().min(1),
	modelName: z.string().trim().min(1),
	partIds: z.array(z.string().min(1)).default([]),
	serviceManual: serviceManualSchema.nullable().optional(),
	warrantyMonths: z.number().int().min(0),
});

const partSchema = z.object({
	description: optionalTextSchema,
	minimumStock: z.number().int().min(0),
	name: z.string().trim().min(1),
	partNumber: optionalTextSchema,
	productModelIds: z.array(z.string().min(1)),
	stockOnHand: z.number().int().min(0),
	supplier: optionalTextSchema,
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
	isActive: z.boolean().default(true),
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
	coveredPartIds: z.array(z.string().min(1)),
	endDate: z.string().trim().min(1),
	hospitalId: z.string().min(1),
	responseSlaHours: z.number().int().min(1),
	startDate: z.string().trim().min(1),
	status: z.enum(["active", "expiring", "expired"]),
	type: z.enum(["full", "partial", "emergency_only"]),
});

const jobStatusSchema = z.enum([
	"created",
	"assigned",
	"in_progress",
	"paused",
	"resumed",
	"completed",
	"timer_anomaly",
	"cancelled",
]);

const nfcJobSchema = z.object({
	accuracyMeters: z.number().min(0).nullable().optional(),
	latitude: z.number().min(-90).max(90).nullable().optional(),
	longitude: z.number().min(-180).max(180).nullable().optional(),
	nfcUid: z.string().trim().min(1),
	notes: optionalTextSchema,
});

const nfcCommissioningSchema = z.object({
	engineerId: optionalTextSchema,
	nfcUid: z.string().trim().min(1),
});

const manualQuestionSchema = z.object({
	assetId: optionalTextSchema,
	engineerId: optionalTextSchema,
	jobId: optionalTextSchema,
	question: z.string().trim().min(3),
});

const pmOpportunityApprovalSchema = z.object({
	description: optionalTextSchema,
	scheduledStartAt: optionalTextSchema,
});

const expenseSchema = z.object({
	amount: z.number().min(0).nullable().optional(),
	notes: optionalTextSchema,
	quantity: z.number().min(0).nullable().optional(),
	receiptFileName: optionalTextSchema,
	type: z.enum(["mileage", "meal", "parking", "other"]),
});

const partUsageSchema = z.object({
	partId: z.string().min(1),
	quantity: z.number().int().min(1),
});

const shortageSchema = z.object({
	notes: optionalTextSchema,
	partId: z.string().min(1),
	quantityRequested: z.number().int().min(1),
});

const systemParameterSchema = z.object({
	key: z.string().trim().min(1),
	value: z.union([z.string(), z.number(), z.boolean()]),
	valueType: z.enum(["number", "string", "secret", "boolean"]),
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

const ensureTenantAccess = async (
	userId: string,
	tenantId: string,
	capability: "manageTenantUsers" | "manageTenants" | "read" | "write" = "read"
) => {
	const access = await getTenantAccessPolicy(userId, tenantId);
	let isAllowed = false;

	if (capability === "read") {
		isAllowed = Boolean(access?.canRead);
	}

	if (capability === "write") {
		isAllowed = Boolean(access?.canWrite);
	}

	if (capability === "manageTenants") {
		isAllowed = Boolean(access?.canManageTenants);
	}

	if (capability === "manageTenantUsers") {
		isAllowed = Boolean(access?.canManageTenantUsers);
	}

	if (!isAllowed) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Tenant access denied",
		});
	}

	return access;
};

export const appRouter = router({
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

				await ensureTenantAccess(
					ctx.session.user.id,
					requestedTenantId,
					"read"
				);

				return getServiceOpsSnapshot(requestedTenantId, ctx.session.user.id);
			}),
		nfcDeviceInfo: protectedProcedure
			.input(
				tenantInputSchema.extend({
					nfcUid: z.string().trim().min(1),
				})
			)
			.query(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "read");
				return getNfcDeviceInfo(input.tenantId, input.nfcUid);
			}),
		createTenant: protectedProcedure
			.input(z.object({ data: tenantSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(
					ctx.session.user.id,
					"platform",
					"manageTenants"
				);
				const tenantId = await createTenantForUser(
					ctx.session.user.id,
					input.data
				);
				return { ...mutationResponse, tenantId };
			}),
		updateTenant: protectedProcedure
			.input(idSchema.extend({ data: tenantSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(
					ctx.session.user.id,
					input.id,
					"manageTenants"
				);
				await updateTenant(input.id, input.data);
				return mutationResponse;
			}),
		deleteTenant: protectedProcedure
			.input(tenantInputSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(
					ctx.session.user.id,
					input.tenantId,
					"manageTenants"
				);
				await deleteTenant(input.tenantId);
				return mutationResponse;
			}),
		createTenantUser: protectedProcedure
			.input(tenantInputSchema.extend({ data: tenantUserSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(
					ctx.session.user.id,
					input.tenantId,
					"manageTenantUsers"
				);
				await createTenantUser(input.tenantId, input.data);
				return mutationResponse;
			}),
		updateTenantUser: protectedProcedure
			.input(idSchema.extend({ data: tenantUserSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(
					ctx.session.user.id,
					input.tenantId,
					"manageTenantUsers"
				);
				await updateTenantUser(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		deleteTenantUser: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(
					ctx.session.user.id,
					input.tenantId,
					"manageTenantUsers"
				);
				await deleteTenantUser(input.tenantId, input.id);
				return mutationResponse;
			}),
		createHospital: protectedProcedure
			.input(tenantInputSchema.extend({ data: hospitalSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await createHospital(input.tenantId, input.data);
				return mutationResponse;
			}),
		updateHospital: protectedProcedure
			.input(idSchema.extend({ data: hospitalSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await updateHospital(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		deleteHospital: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await deleteHospital(input.tenantId, input.id);
				return mutationResponse;
			}),
		createEngineer: protectedProcedure
			.input(tenantInputSchema.extend({ data: engineerSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await createEngineer(input.tenantId, input.data);
				return mutationResponse;
			}),
		updateEngineer: protectedProcedure
			.input(idSchema.extend({ data: engineerSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await updateEngineer(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		deleteEngineer: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await deleteEngineer(input.tenantId, input.id);
				return mutationResponse;
			}),
		createProduct: protectedProcedure
			.input(tenantInputSchema.extend({ data: productSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await createProduct(input.tenantId, input.data);
				return mutationResponse;
			}),
		updateProduct: protectedProcedure
			.input(idSchema.extend({ data: productSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await updateProduct(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		deleteProduct: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await deleteProduct(input.tenantId, input.id);
				return mutationResponse;
			}),
		updateProductParts: protectedProcedure
			.input(
				idSchema.extend({
					data: z.object({ partIds: z.array(z.string().min(1)) }),
				})
			)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await updateProductParts(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		uploadServiceManual: protectedProcedure
			.input(idSchema.extend({ data: serviceManualSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await uploadServiceManualMetadata(
					input.tenantId,
					ctx.session.user.id,
					input.id,
					input.data
				);
				return mutationResponse;
			}),
		askServiceManualQuestion: protectedProcedure
			.input(tenantInputSchema.extend({ data: manualQuestionSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "read");
				return askServiceManualQuestion(input.tenantId, input.data);
			}),
		createPart: protectedProcedure
			.input(tenantInputSchema.extend({ data: partSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await createPart(input.tenantId, input.data);
				return mutationResponse;
			}),
		updatePart: protectedProcedure
			.input(idSchema.extend({ data: partSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await updatePart(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		deletePart: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await deletePart(input.tenantId, input.id);
				return mutationResponse;
			}),
		createAsset: protectedProcedure
			.input(tenantInputSchema.extend({ data: assetSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await createAsset(input.tenantId, input.data);
				return mutationResponse;
			}),
		updateAsset: protectedProcedure
			.input(idSchema.extend({ data: assetSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await updateAsset(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		deleteAsset: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await deleteAsset(input.tenantId, input.id);
				return mutationResponse;
			}),
		commissionAssetNfcTag: protectedProcedure
			.input(idSchema.extend({ data: nfcCommissioningSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await commissionAssetNfcTag(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		replaceAssetNfcTag: protectedProcedure
			.input(idSchema.extend({ data: nfcCommissioningSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await replaceAssetNfcTag(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		createJob: protectedProcedure
			.input(tenantInputSchema.extend({ data: jobSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await createJob(input.tenantId, ctx.session.user.id, input.data);
				return mutationResponse;
			}),
		updateJob: protectedProcedure
			.input(idSchema.extend({ data: jobSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
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
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await deleteJob(input.tenantId, input.id);
				return mutationResponse;
			}),
		transitionJob: protectedProcedure
			.input(
				idSchema.extend({
					data: z.object({
						notes: optionalTextSchema,
						status: jobStatusSchema,
					}),
				})
			)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await transitionJob(
					input.tenantId,
					ctx.session.user.id,
					input.id,
					input.data
				);
				return mutationResponse;
			}),
		startJobWithNfc: protectedProcedure
			.input(idSchema.extend({ data: nfcJobSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await startJobWithNfc(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		endJobWithNfc: protectedProcedure
			.input(idSchema.extend({ data: nfcJobSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await endJobWithNfc(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		reportTimerAnomaly: protectedProcedure
			.input(idSchema.extend({ data: nfcJobSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await reportTimerAnomaly(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		logJobExpense: protectedProcedure
			.input(idSchema.extend({ data: expenseSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await logJobExpense(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		addJobPartUsage: protectedProcedure
			.input(idSchema.extend({ data: partUsageSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await addJobPartUsage(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		reportPartsShortage: protectedProcedure
			.input(idSchema.extend({ data: shortageSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await reportPartsShortage(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		recalculateJobCost: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await recalculateJobCost(input.tenantId, input.id);
				return mutationResponse;
			}),
		createContract: protectedProcedure
			.input(tenantInputSchema.extend({ data: contractSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await createContract(input.tenantId, input.data);
				return mutationResponse;
			}),
		updateContract: protectedProcedure
			.input(idSchema.extend({ data: contractSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await updateContract(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		deleteContract: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await deleteContract(input.tenantId, input.id);
				return mutationResponse;
			}),
		refreshContractStatuses: protectedProcedure
			.input(tenantInputSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await refreshContractStatuses(input.tenantId);
				return mutationResponse;
			}),
		createFault: protectedProcedure
			.input(tenantInputSchema.extend({ data: faultSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await createFault(input.tenantId, input.data);
				return mutationResponse;
			}),
		updateFault: protectedProcedure
			.input(idSchema.extend({ data: faultSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await updateFault(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
		deleteFault: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await deleteFault(input.tenantId, input.id);
				return mutationResponse;
			}),
		convertFaultToRepairJob: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await convertFaultToRepairJob(
					input.tenantId,
					ctx.session.user.id,
					input.id
				);
				return mutationResponse;
			}),
		confirmPartsArrived: protectedProcedure
			.input(idSchema)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await confirmPartsArrived(
					input.tenantId,
					ctx.session.user.id,
					input.id
				);
				return mutationResponse;
			}),
		resumeShortageJob: protectedProcedure
			.input(
				idSchema.extend({
					data: z.object({ scheduledStartAt: optionalTextSchema }),
				})
			)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await resumeShortageJob(
					input.tenantId,
					ctx.session.user.id,
					input.id,
					input.data
				);
				return mutationResponse;
			}),
		updateSystemParameter: protectedProcedure
			.input(tenantInputSchema.extend({ data: systemParameterSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await updateSystemParameter(
					input.tenantId,
					ctx.session.user.id,
					input.data
				);
				return mutationResponse;
			}),
		generateOperationalReport: protectedProcedure
			.input(
				tenantInputSchema.extend({
					period: z.enum(["day", "week", "month"]),
				})
			)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await generateOperationalReportSnapshot(input.tenantId, input.period);
				return mutationResponse;
			}),
		approvePmOpportunity: protectedProcedure
			.input(idSchema.extend({ data: pmOpportunityApprovalSchema }))
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await approvePmOpportunity(
					input.tenantId,
					ctx.session.user.id,
					input.id,
					input.data
				);
				return mutationResponse;
			}),
		clockEngineer: protectedProcedure
			.input(
				idSchema.extend({
					data: z.object({
						accuracyMeters: z.number().min(0).nullable().optional(),
						eventType: z.enum(["clock_in", "clock_out"]),
						latitude: z.number().min(-90).max(90).nullable().optional(),
						longitude: z.number().min(-180).max(180).nullable().optional(),
					}),
				})
			)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await clockEngineer(
					input.tenantId,
					input.id,
					input.data.eventType,
					input.data
				);
				return mutationResponse;
			}),
		recordEngineerLocation: protectedProcedure
			.input(
				idSchema.extend({
					data: z.object({
						accuracyMeters: z.number().min(0).nullable().optional(),
						jobId: optionalTextSchema,
						latitude: z.number().min(-90).max(90),
						longitude: z.number().min(-180).max(180),
					}),
				})
			)
			.mutation(async ({ ctx, input }) => {
				await ensureTenantAccess(ctx.session.user.id, input.tenantId, "write");
				await recordEngineerLocation(input.tenantId, input.id, input.data);
				return mutationResponse;
			}),
	}),
});
export type AppRouter = typeof appRouter;
