import { randomUUID } from "node:crypto";
import { db } from "@luke/db";
import { account, user } from "@luke/db/schema/auth";
import {
	assets,
	contractModelCoverage,
	contractPartCoverage,
	contracts,
	engineerClockEvents,
	engineerLocations,
	engineers,
	faultReports,
	fileAttachments,
	geofenceEvents,
	hospitals,
	jobCosts,
	jobExpenses,
	jobPartsUsage,
	jobStateEvents,
	jobs,
	jobTimers,
	manualQaQueries,
	nfcEvents,
	nfcTags,
	opportunisticPmAlerts,
	partInventory,
	parts,
	partsShortages,
	productModelParts,
	productModels,
	pushNotifications,
	reportSnapshots,
	serviceManualSections,
	serviceManuals,
	systemParameters,
	tenantMemberships,
	tenants,
	websocketEvents,
} from "@luke/db/schema/service-ops";
import { hashPassword } from "better-auth/crypto";
import {
	and,
	asc,
	desc,
	eq,
	ilike,
	inArray,
	isNull,
	lte,
	ne,
	or,
	sql,
} from "drizzle-orm";
import type {
	Asset,
	Contract,
	ContractStatus,
	CostRecord,
	DashboardStat,
	Engineer,
	EngineerStatus,
	FaultReport,
	FaultStatus,
	Hospital,
	Job,
	JobStatus,
	JobType,
	LiveAlert,
	ManualAnswer,
	ManualQuestionResult,
	NfcDeviceInfo,
	Part,
	Priority,
	ProductModel,
	ReportMetric,
	ServiceOpsSnapshot,
	SystemParameter,
	TenantManagementRecord,
	TenantRole,
	TenantUserRecord,
} from "../types/service-ops";

const platformTenantId = "platform";

type TenantRow = typeof tenants.$inferSelect;
type TenantInsert = typeof tenants.$inferInsert;
type TenantMembershipRow = typeof tenantMemberships.$inferSelect;
type UserInsert = typeof user.$inferInsert;
type JobRow = typeof jobs.$inferSelect;
type AssetRow = typeof assets.$inferSelect;
type ContractRow = typeof contracts.$inferSelect;
type EngineerRow = typeof engineers.$inferSelect;
type FaultReportRow = typeof faultReports.$inferSelect;
type HospitalInsert = typeof hospitals.$inferInsert;
type EngineerInsert = typeof engineers.$inferInsert;
type ProductInsert = typeof productModels.$inferInsert;
type PartInsert = typeof parts.$inferInsert;
type AssetInsert = typeof assets.$inferInsert;
type JobInsert = typeof jobs.$inferInsert;
type ContractInsert = typeof contracts.$inferInsert;
type FaultReportInsert = typeof faultReports.$inferInsert;

export interface TenantMutationInput {
	id?: null | string;
	isActive: boolean;
	name: string;
	region: string;
	releaseLabel: string;
}

export interface TenantUserMutationInput {
	email: string;
	name: string;
	password?: null | string;
	role: Exclude<TenantRole, "super_admin">;
	status: TenantMembershipRow["status"];
}

export interface HospitalMutationInput {
	address?: null | string;
	code: string;
	district: string;
	latitude?: null | number;
	longitude?: null | number;
	name: string;
	primaryContactEmail?: null | string;
	primaryContactName?: null | string;
	primaryContactPhone?: null | string;
	regionProvince?: null | string;
}

export interface EngineerMutationInput {
	code: string;
	email?: null | string;
	grade: string;
	hourlyRate: number;
	mealCap: number;
	mileageRate: number;
	name: string;
	phone?: null | string;
	region: string;
	status: EngineerRow["status"];
}

export interface ProductMutationInput {
	category: string;
	code: string;
	defaultPmCycleMonths: number;
	isEngineerReadOnly: boolean;
	manufacturer: string;
	modelName: string;
	partIds: string[];
	serviceManual?: null | ServiceManualMutationInput;
}

export interface PartMutationInput {
	description?: null | string;
	minimumStock: number;
	name: string;
	partNumber?: null | string;
	productModelIds: string[];
	stockOnHand: number;
	supplier?: null | string;
	unitCost: number;
}

export interface AssetMutationInput {
	assetNumber: string;
	contractCoverageStatus: AssetRow["contractCoverageStatus"];
	designatedEngineerId?: null | string;
	hospitalId: string;
	installationDate?: null | string;
	locationLabel: string;
	nextPmDueDate?: null | string;
	nfcUid: string;
	productModelId: string;
	serialNumber: string;
	warrantyExpiryDate?: null | string;
}

export interface JobMutationInput {
	assetId: string;
	assignedEngineerId?: null | string;
	description: string;
	hospitalId: string;
	jobNumber: string;
	priority: JobRow["priority"];
	scheduledStartAt?: null | string;
	status: JobRow["status"];
	type: JobRow["type"];
}

export interface ContractMutationInput {
	accountManagerName: string;
	contractNumber: string;
	coveredModelIds: string[];
	coveredPartIds: string[];
	endDate: string;
	hospitalId: string;
	responseSlaHours: number;
	startDate: string;
	status: ContractRow["status"];
	type: ContractRow["type"];
}

export interface FaultMutationInput {
	assetId?: null | string;
	description: string;
	hospitalId: string;
	reportNumber: string;
	severity: FaultReportRow["severity"];
	status: FaultReportRow["status"];
	submittedByContact?: null | string;
	submittedByName: string;
}

export interface JobTransitionInput {
	notes?: null | string;
	status: JobRow["status"];
}

export interface NfcJobInput {
	accuracyMeters?: null | number;
	latitude?: null | number;
	longitude?: null | number;
	nfcUid: string;
	notes?: null | string;
}

export interface ExpenseMutationInput {
	amount?: null | number;
	notes?: null | string;
	quantity?: null | number;
	receiptFileName?: null | string;
	type: typeof jobExpenses.$inferInsert.type;
}

export interface PartUsageMutationInput {
	partId: string;
	quantity: number;
}

export interface ShortageMutationInput {
	notes?: null | string;
	partId: string;
	quantityRequested: number;
}

export interface ResumeShortageInput {
	scheduledStartAt?: null | string;
}

export interface SystemParameterMutationInput {
	key: string;
	value: unknown;
	valueType: typeof systemParameters.$inferInsert.valueType;
}

export interface ProductPartsMutationInput {
	partIds: string[];
}

export interface ServiceManualMutationInput {
	fileName: string;
	fileUrl: string;
	pageCount?: null | number;
	storageKey?: null | string;
	version?: null | string;
}

export interface NfcCommissioningInput {
	engineerId?: null | string;
	nfcUid: string;
}

export interface ManualQuestionInput {
	assetId?: null | string;
	engineerId?: null | string;
	jobId?: null | string;
	question: string;
}

export interface ApprovePmOpportunityInput {
	description?: null | string;
	scheduledStartAt?: null | string;
}

const defaultRegion = "Hong Kong";
const defaultReleaseLabel = "Early Release v1";
const maxTenantIdLength = 56;
const nonAlphanumericRegex = /[^a-z0-9]+/g;
const edgeHyphenRegex = /^-+|-+$/g;
const manualQuestionTermRegex = /\W+/;

const defaultSystemParameters = [
	{
		description: "Default mileage reimbursement rate.",
		key: "mileage_rate_hkd_per_km",
		value: 4.8,
		valueType: "number",
	},
	{
		description: "Default meal cap per day.",
		key: "meal_cap_hkd_per_day",
		value: 95,
		valueType: "number",
	},
	{
		description: "Days before contract expiry to show warnings.",
		key: "contract_expiry_warning_days",
		value: 30,
		valueType: "number",
	},
	{
		description: "Geofence radius used for on-site validation.",
		key: "geofence_radius_meters",
		value: 200,
		valueType: "number",
	},
	{
		description: "Minutes before geofence exit becomes a timer anomaly.",
		key: "geofence_alert_countdown_minutes",
		value: 5,
		valueType: "number",
	},
	{
		description: "Advance window for opportunistic PM alerts.",
		key: "pm_advance_window_days",
		value: 2,
		valueType: "number",
	},
	{
		description: "Google Maps browser API key.",
		key: "google_maps_api_key",
		value: "",
		valueType: "secret",
	},
] as const;

const jobTransitionMap = {
	assigned: ["in_progress", "paused", "cancelled"],
	cancelled: [],
	completed: [],
	created: ["assigned", "cancelled"],
	in_progress: ["paused", "completed", "timer_anomaly", "cancelled"],
	paused: ["resumed", "cancelled"],
	resumed: ["in_progress", "paused", "completed", "timer_anomaly", "cancelled"],
	timer_anomaly: ["in_progress", "paused", "completed", "cancelled"],
} as const satisfies Record<JobRow["status"], readonly JobRow["status"][]>;

const mutableJobStatuses = ["created", "assigned"] as const;

const millisecondsPerMinute = 60_000;
const minutesPerHour = 60;
const earthRadiusMeters = 6_371_000;

const numberFrom = (value: null | string): number => Number(value ?? 0);

const slugify = (value: string): string =>
	value
		.toLowerCase()
		.replace(nonAlphanumericRegex, "-")
		.replace(edgeHyphenRegex, "")
		.slice(0, 32);

const getTenantSeed = (user: {
	email?: null | string;
	id: string;
	name?: null | string;
}) => {
	const emailDomain = user.email?.split("@").at(1);
	const baseName = user.name?.trim() || emailDomain || "Workspace";
	const slugBase = slugify(emailDomain ?? baseName) || "workspace";
	const userSuffix = slugify(user.id).slice(0, 12) || "user";

	return {
		id: `tenant-${slugBase}-${userSuffix}`.slice(0, maxTenantIdLength),
		name: `${baseName} Workspace`,
	};
};

const dateLabel = (value: Date | null): string => {
	if (!value) {
		return "Not scheduled";
	}

	const formatter = new Intl.DateTimeFormat("en-HK", {
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		month: "short",
		timeZone: "Asia/Hong_Kong",
	});

	return formatter.format(value);
};

const dateOnly = (value: null | string): string => value ?? "Not set";

const titleCase = (value: string): string =>
	value
		.split("_")
		.map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
		.join(" ");

const mapJobStatus = (status: JobRow["status"]): JobStatus => {
	const labels: Record<JobRow["status"], JobStatus> = {
		assigned: "Assigned",
		cancelled: "Cancelled",
		completed: "Completed",
		created: "Created",
		in_progress: "In Progress",
		paused: "Paused",
		resumed: "Resumed",
		timer_anomaly: "Timer Anomaly",
	};

	return labels[status];
};

const mapJobType = (type: JobRow["type"]): JobType => {
	const labels: Record<JobRow["type"], JobType> = {
		installation: "Installation",
		preventive_maintenance: "Preventive Maintenance",
		repair: "Repair",
	};

	return labels[type];
};

const mapPriority = (priority: JobRow["priority"]): Priority =>
	priority === "urgent" ? "Urgent" : "Normal";

const mapEngineerStatus = (
	status: typeof engineers.$inferSelect.status
): EngineerStatus => {
	const labels: Record<typeof status, EngineerStatus> = {
		idle: "Idle",
		in_transit: "In transit",
		off_duty: "Off duty",
		on_site: "On-site",
		timer_anomaly: "Timer anomaly",
	};

	return labels[status];
};

const mapContractStatus = (
	status: typeof contracts.$inferSelect.status
): ContractStatus => {
	const labels: Record<typeof status, ContractStatus> = {
		active: "Active",
		expired: "Expired",
		expiring: "Expiring",
	};

	return labels[status];
};

const mapContractType = (
	type: typeof contracts.$inferSelect.type
): Contract["type"] => {
	const labels: Record<typeof type, Contract["type"]> = {
		emergency_only: "Emergency only",
		full: "Full",
		partial: "Partial",
	};

	return labels[type];
};

type CoverageStatusValue = AssetRow["contractCoverageStatus"];

const mapCoverage = (
	status: CoverageStatusValue
): Asset["contractCoverage"] => {
	const labels: Record<CoverageStatusValue, Asset["contractCoverage"]> = {
		billable_exception: "Billable exception",
		expired: "Expired",
		in_contract: "In contract",
		out_of_contract: "Billable exception",
	};

	return labels[status];
};

const mapFaultStatus = (
	status: typeof faultReports.$inferSelect.status
): FaultStatus => {
	const labels: Record<typeof status, FaultStatus> = {
		engineer_assigned: "Engineer Assigned",
		in_progress: "In Progress",
		received: "Received",
		resolved: "Resolved",
	};

	return labels[status];
};

const mapSeverity = (severity: typeof faultReports.$inferSelect.severity) =>
	titleCase(severity) as FaultReport["severity"];

const formatMoney = (value: null | string): string => {
	const amount = Number(value ?? 0);

	if (amount === 0) {
		return "HK$0";
	}

	return `HK$${amount.toLocaleString("en-HK", {
		maximumFractionDigits: 0,
	})}`;
};

const formatParameterValue = (key: string, value: unknown): string => {
	if (typeof value === "number") {
		if (key.includes("mileage_rate")) {
			return `HK$${value.toFixed(2)} / km`;
		}

		if (key.includes("meal_cap")) {
			return `HK$${value} / day`;
		}

		if (key.includes("radius")) {
			return `${value} m`;
		}

		if (key.includes("minutes")) {
			return `${value} min`;
		}

		return `${value} days`;
	}

	return String(value);
};

const parameterLabel = (key: string): string => {
	const labels: Record<string, string> = {
		contract_expiry_warning_days: "Contract warning",
		geofence_alert_countdown_minutes: "Alert countdown",
		geofence_radius_meters: "Geofence radius",
		google_maps_api_key: "Google Maps API key",
		meal_cap_hkd_per_day: "Meal cap",
		mileage_rate_hkd_per_km: "Mileage rate",
		pm_advance_window_days: "PM advance window",
	};

	return labels[key] ?? titleCase(key);
};

const formatDateTime = (value: Date): string =>
	new Intl.DateTimeFormat("en-HK", {
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		month: "short",
		timeZone: "Asia/Hong_Kong",
		year: "numeric",
	}).format(value);

const formatDateOnly = (value: Date): string =>
	new Intl.DateTimeFormat("en-CA", {
		day: "2-digit",
		month: "2-digit",
		timeZone: "Asia/Hong_Kong",
		year: "numeric",
	}).format(value);

const addMonths = (value: Date, months: number): Date => {
	const nextDate = new Date(value);
	nextDate.setMonth(nextDate.getMonth() + months);

	return nextDate;
};

const degreesToRadians = (value: number): number => (value * Math.PI) / 180;

const distanceMetersBetween = (
	from: { latitude: number; longitude: number },
	to: { latitude: number; longitude: number }
): number => {
	const deltaLatitude = degreesToRadians(to.latitude - from.latitude);
	const deltaLongitude = degreesToRadians(to.longitude - from.longitude);
	const fromLatitude = degreesToRadians(from.latitude);
	const toLatitude = degreesToRadians(to.latitude);
	const haversine =
		Math.sin(deltaLatitude / 2) ** 2 +
		Math.cos(fromLatitude) *
			Math.cos(toLatitude) *
			Math.sin(deltaLongitude / 2) ** 2;

	return Math.round(
		earthRadiusMeters *
			2 *
			Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
	);
};

const assertJobTransition = (
	fromStatus: JobRow["status"],
	toStatus: JobRow["status"]
) => {
	if (fromStatus === toStatus) {
		return;
	}

	if (
		(jobTransitionMap[fromStatus] as readonly JobRow["status"][]).includes(
			toStatus
		)
	) {
		return;
	}

	throw new Error(
		`Invalid job transition from ${titleCase(fromStatus)} to ${titleCase(toStatus)}`
	);
};

const isMutableJobStatus = (status: JobRow["status"]) =>
	mutableJobStatuses.includes(status as (typeof mutableJobStatuses)[number]);

const getNumericSystemParameter = async (
	tenantId: string,
	key: string,
	fallback: number
): Promise<number> => {
	const [parameter] = await db
		.select({ value: systemParameters.value })
		.from(systemParameters)
		.where(
			and(
				eq(systemParameters.tenantId, tenantId),
				eq(systemParameters.key, key)
			)
		)
		.limit(1);

	const value = Number(parameter?.value ?? fallback);

	return Number.isFinite(value) ? value : fallback;
};

const createWebsocketEvent = async ({
	entityId,
	entityType,
	eventType,
	payload,
	tenantId,
}: {
	entityId: string;
	entityType: string;
	eventType: string;
	payload?: Record<string, unknown>;
	tenantId: string;
}) => {
	await db.insert(websocketEvents).values({
		channel: `tenant.${tenantId}`,
		entityId,
		entityType,
		eventType,
		payload: payload ?? {},
		tenantId,
	});
};

const queueNotification = async ({
	body,
	engineerId,
	jobId,
	recipientUserId,
	tenantId,
	title,
	type,
}: {
	body: string;
	engineerId?: null | string;
	jobId?: null | string;
	recipientUserId?: null | string;
	tenantId: string;
	title: string;
	type: typeof pushNotifications.$inferInsert.type;
}) => {
	await db.insert(pushNotifications).values({
		body,
		engineerId: engineerId ?? null,
		jobId: jobId ?? null,
		payload: {},
		recipientUserId: recipientUserId ?? null,
		status: "queued",
		tenantId,
		title,
		type,
	});
};

const getActiveContractForHospital = async (
	tx: typeof db,
	tenantId: string,
	hospitalId: string
) => {
	const [contract] = await tx
		.select({ id: contracts.id })
		.from(contracts)
		.where(
			and(
				eq(contracts.tenantId, tenantId),
				eq(contracts.hospitalId, hospitalId),
				eq(contracts.status, "active")
			)
		)
		.orderBy(desc(contracts.endDate))
		.limit(1);

	return contract ?? null;
};

const getPartCoverageStatus = async (
	tx: typeof db,
	tenantId: string,
	hospitalId: string,
	partId: string
) => {
	const contract = await getActiveContractForHospital(tx, tenantId, hospitalId);

	if (!contract) {
		return "expired" as const;
	}

	const [coverage] = await tx
		.select({ coverageStatus: contractPartCoverage.coverageStatus })
		.from(contractPartCoverage)
		.where(
			and(
				eq(contractPartCoverage.tenantId, tenantId),
				eq(contractPartCoverage.contractId, contract.id),
				eq(contractPartCoverage.partId, partId)
			)
		)
		.limit(1);

	return coverage?.coverageStatus ?? "out_of_contract";
};

const getAccessPolicyForRole = (
	role: TenantRole
): ServiceOpsSnapshot["access"] => {
	const canManageTenants = role === "super_admin";
	const canManageTenantUsers = canManageTenants || role === "tenant_admin";
	const canWrite = canManageTenantUsers || role === "operator";

	return {
		canManageTenantUsers,
		canManageTenants,
		canRead: true,
		canWrite,
		role,
	};
};

const userIsSuperAdmin = async (userId: string): Promise<boolean> => {
	const [superAdminMembership] = await db
		.select({ id: tenantMemberships.id })
		.from(tenantMemberships)
		.where(
			and(
				eq(tenantMemberships.userId, userId),
				eq(tenantMemberships.role, "super_admin"),
				eq(tenantMemberships.status, "active")
			)
		)
		.limit(1);

	return Boolean(superAdminMembership);
};

export async function getDefaultTenantIdForUser(
	userId: string
): Promise<string | null> {
	const [membership] = await db
		.select({ tenantId: tenantMemberships.tenantId })
		.from(tenantMemberships)
		.innerJoin(tenants, eq(tenants.id, tenantMemberships.tenantId))
		.where(
			and(
				eq(tenants.isActive, true),
				eq(tenantMemberships.userId, userId),
				eq(tenantMemberships.status, "active")
			)
		)
		.orderBy(asc(tenantMemberships.createdAt))
		.limit(1);

	return membership?.tenantId ?? null;
}

export async function ensureDefaultTenantForUser(user: {
	email?: null | string;
	id: string;
	name?: null | string;
}): Promise<string> {
	const existingTenantId = await getDefaultTenantIdForUser(user.id);

	if (existingTenantId) {
		return existingTenantId;
	}

	const tenantSeed = getTenantSeed(user);

	await db.transaction(async (tx) => {
		await tx
			.insert(tenants)
			.values({
				id: tenantSeed.id,
				name: tenantSeed.name,
				region: defaultRegion,
				releaseLabel: defaultReleaseLabel,
			})
			.onConflictDoNothing();

		await tx
			.insert(tenantMemberships)
			.values({
				permissions: ["*"],
				role: "tenant_admin",
				status: "active",
				tenantId: tenantSeed.id,
				userId: user.id,
			})
			.onConflictDoNothing();

		await tx
			.insert(systemParameters)
			.values(
				defaultSystemParameters.map((parameter) => ({
					description: parameter.description,
					key: parameter.key,
					tenantId: tenantSeed.id,
					value: parameter.value,
					valueType: parameter.valueType,
				}))
			)
			.onConflictDoNothing();
	});

	const tenantId = await getDefaultTenantIdForUser(user.id);

	if (!tenantId) {
		throw new Error("Unable to create tenant membership for this user.");
	}

	return tenantId;
}

export async function getTenantAccessPolicy(
	userId: string,
	tenantId: string
): Promise<ServiceOpsSnapshot["access"] | null> {
	if (await userIsSuperAdmin(userId)) {
		return getAccessPolicyForRole("super_admin");
	}

	const [membership] = await db
		.select({
			id: tenantMemberships.id,
			role: tenantMemberships.role,
			status: tenantMemberships.status,
		})
		.from(tenantMemberships)
		.where(
			and(
				eq(tenantMemberships.userId, userId),
				eq(tenantMemberships.tenantId, tenantId),
				eq(tenantMemberships.status, "active")
			)
		)
		.limit(1);

	if (!membership) {
		return null;
	}

	return getAccessPolicyForRole(membership.role);
}

export async function userCanAccessTenant(
	userId: string,
	tenantId: string
): Promise<boolean> {
	return Boolean(await getTenantAccessPolicy(userId, tenantId));
}

export async function getTenantsForUser(
	userId: string
): Promise<TenantManagementRecord[]> {
	const accessRows = await db
		.select({
			role: tenantMemberships.role,
			tenantId: tenantMemberships.tenantId,
		})
		.from(tenantMemberships)
		.where(
			and(
				eq(tenantMemberships.userId, userId),
				eq(tenantMemberships.status, "active")
			)
		);
	const isSuperAdmin = accessRows.some((row) => row.role === "super_admin");

	if (isSuperAdmin) {
		const rows = await db
			.select({
				createdAt: tenants.createdAt,
				id: tenants.id,
				isActive: tenants.isActive,
				memberCount:
					sql<number>`count(distinct ${tenantMemberships.userId})`.mapWith(
						Number
					),
				name: tenants.name,
				region: tenants.region,
				releaseLabel: tenants.releaseLabel,
			})
			.from(tenants)
			.leftJoin(tenantMemberships, eq(tenantMemberships.tenantId, tenants.id))
			.groupBy(
				tenants.id,
				tenants.name,
				tenants.region,
				tenants.releaseLabel,
				tenants.isActive,
				tenants.createdAt
			)
			.orderBy(desc(tenants.createdAt));

		return rows.map((row) => ({
			createdAt: formatDateTime(row.createdAt),
			id: row.id,
			isActive: row.isActive,
			memberCount: row.memberCount,
			name: row.name,
			recordId: row.id,
			region: row.region,
			release: row.releaseLabel,
			role: "super_admin",
			status: "active",
		}));
	}

	const rows = await db
		.select({
			createdAt: tenants.createdAt,
			id: tenants.id,
			isActive: tenants.isActive,
			memberCount:
				sql<number>`count(distinct ${tenantMemberships.userId})`.mapWith(
					Number
				),
			name: tenants.name,
			region: tenants.region,
			releaseLabel: tenants.releaseLabel,
			role: tenantMemberships.role,
			status: tenantMemberships.status,
		})
		.from(tenantMemberships)
		.innerJoin(tenants, eq(tenants.id, tenantMemberships.tenantId))
		.where(eq(tenantMemberships.userId, userId))
		.groupBy(
			tenants.id,
			tenants.name,
			tenants.region,
			tenants.releaseLabel,
			tenants.isActive,
			tenants.createdAt,
			tenantMemberships.role,
			tenantMemberships.status
		)
		.orderBy(desc(tenants.createdAt));

	return rows.map((row) => ({
		createdAt: formatDateTime(row.createdAt),
		id: row.id,
		isActive: row.isActive,
		memberCount: row.memberCount,
		name: row.name,
		recordId: row.id,
		region: row.region,
		release: row.releaseLabel,
		role: row.role,
		status: row.status,
	}));
}

export async function getTenantUsers(
	tenantId: string
): Promise<TenantUserRecord[]> {
	const rows = await db
		.select({
			createdAt: tenantMemberships.createdAt,
			email: user.email,
			id: user.id,
			membershipId: tenantMemberships.id,
			name: user.name,
			role: tenantMemberships.role,
			status: tenantMemberships.status,
		})
		.from(tenantMemberships)
		.innerJoin(user, eq(user.id, tenantMemberships.userId))
		.where(eq(tenantMemberships.tenantId, tenantId))
		.orderBy(asc(user.name));

	return rows.map((row) => ({
		createdAt: formatDateTime(row.createdAt),
		email: row.email,
		id: row.id,
		membershipId: row.membershipId,
		name: row.name,
		role: row.role,
		status: row.status,
	}));
}

const getTenant = async (tenantId: string): Promise<TenantRow> => {
	const [tenant] = await db
		.select()
		.from(tenants)
		.where(and(eq(tenants.id, tenantId), eq(tenants.isActive, true)))
		.limit(1);

	if (!tenant) {
		throw new Error(`Tenant ${tenantId} was not found`);
	}

	return tenant;
};

const getTenantRecord = async (tenantId: string): Promise<TenantRow> => {
	const [tenant] = await db
		.select()
		.from(tenants)
		.where(eq(tenants.id, tenantId))
		.limit(1);

	if (!tenant) {
		throw new Error(`Tenant ${tenantId} was not found`);
	}

	return tenant;
};

const toNullableString = (value: null | string | undefined): null | string =>
	value?.trim() ? value.trim() : null;

const toNullableCoordinate = (
	value: null | number | undefined
): null | string =>
	value === null || value === undefined ? null : String(value);

const toDateValue = (value: null | string | undefined): null | string =>
	value?.trim() ? value.trim() : null;

const toTimestampValue = (value: null | string | undefined): Date | null =>
	value?.trim() ? new Date(value) : null;

const toMoneyValue = (value: number): string => value.toFixed(2);

const toTenantId = (value: string): string =>
	slugify(value).slice(0, maxTenantIdLength) || `tenant-${Date.now()}`;

const ensureRecordBelongsToTenant = async <T>(
	tableName: string,
	lookup: Promise<T | undefined>
): Promise<T> => {
	const row = await lookup;

	if (!row) {
		throw new Error(`${tableName} record was not found for this tenant`);
	}

	return row;
};

const getTenantHospitalRecord = (tenantId: string, id: string) =>
	ensureRecordBelongsToTenant(
		"Hospital",
		db.query.hospitals.findFirst({
			where: and(eq(hospitals.id, id), eq(hospitals.tenantId, tenantId)),
		})
	);

const getTenantEngineerRecord = (tenantId: string, id: string) =>
	ensureRecordBelongsToTenant(
		"Engineer",
		db.query.engineers.findFirst({
			where: and(eq(engineers.id, id), eq(engineers.tenantId, tenantId)),
		})
	);

const getTenantProductRecord = (tenantId: string, id: string) =>
	ensureRecordBelongsToTenant(
		"Product",
		db.query.productModels.findFirst({
			where: and(
				eq(productModels.id, id),
				eq(productModels.tenantId, tenantId)
			),
		})
	);

const ensureTenantProductRecords = async (
	tenantId: string,
	productModelIds: string[]
) => {
	for (const productModelId of productModelIds) {
		await getTenantProductRecord(tenantId, productModelId);
	}
};

const getTenantPartRecord = (tenantId: string, id: string) =>
	ensureRecordBelongsToTenant(
		"Part",
		db.query.parts.findFirst({
			where: and(eq(parts.id, id), eq(parts.tenantId, tenantId)),
		})
	);

const ensureTenantPartRecords = async (tenantId: string, partIds: string[]) => {
	for (const partId of partIds) {
		await getTenantPartRecord(tenantId, partId);
	}
};

const getTenantAssetRecord = (tenantId: string, id: string) =>
	ensureRecordBelongsToTenant(
		"Asset",
		db.query.assets.findFirst({
			where: and(eq(assets.id, id), eq(assets.tenantId, tenantId)),
		})
	);

const getTenantAssetByNfcUid = (tenantId: string, nfcUid: string) =>
	ensureRecordBelongsToTenant(
		"Asset",
		db.query.assets.findFirst({
			where: and(eq(assets.nfcUid, nfcUid), eq(assets.tenantId, tenantId)),
		})
	);

const getTenantJobRecord = (tenantId: string, id: string) =>
	ensureRecordBelongsToTenant(
		"Job",
		db.query.jobs.findFirst({
			where: and(eq(jobs.id, id), eq(jobs.tenantId, tenantId)),
		})
	);

const getTenantContractRecord = (tenantId: string, id: string) =>
	ensureRecordBelongsToTenant(
		"Contract",
		db.query.contracts.findFirst({
			where: and(eq(contracts.id, id), eq(contracts.tenantId, tenantId)),
		})
	);

const getTenantFaultRecord = (tenantId: string, id: string) =>
	ensureRecordBelongsToTenant(
		"Fault report",
		db.query.faultReports.findFirst({
			where: and(eq(faultReports.id, id), eq(faultReports.tenantId, tenantId)),
		})
	);

const getTenantPmAlertRecord = (tenantId: string, id: string) =>
	ensureRecordBelongsToTenant(
		"PM opportunity",
		db.query.opportunisticPmAlerts.findFirst({
			where: and(
				eq(opportunisticPmAlerts.id, id),
				eq(opportunisticPmAlerts.tenantId, tenantId)
			),
		})
	);

const validateOptionalTenantRecord = async (
	tenantId: string,
	id: null | string | undefined,
	lookup: (tenantId: string, id: string) => Promise<unknown>
) => {
	if (id) {
		await lookup(tenantId, id);
	}
};

const getHospitals = async (tenantId: string): Promise<Hospital[]> => {
	const rows = await db
		.select({
			address: hospitals.address,
			assetCount: sql<number>`count(distinct ${assets.id})`.mapWith(Number),
			code: hospitals.code,
			contractStatus: sql<typeof contracts.$inferSelect.status | null>`case
				when bool_or(${contracts.status} = 'expired') then 'expired'
				when bool_or(${contracts.status} = 'expiring') then 'expiring'
				when bool_or(${contracts.status} = 'active') then 'active'
				else null
			end`,
			district: hospitals.district,
			id: hospitals.id,
			latitude: hospitals.latitude,
			longitude: hospitals.longitude,
			name: hospitals.name,
			openJobs:
				sql<number>`count(distinct ${jobs.id}) filter (where ${jobs.status} <> 'completed' and ${jobs.status} <> 'cancelled')`.mapWith(
					Number
				),
			primaryContactEmail: hospitals.primaryContactEmail,
			primaryContactName: hospitals.primaryContactName,
			primaryContactPhone: hospitals.primaryContactPhone,
			regionProvince: hospitals.regionProvince,
		})
		.from(hospitals)
		.leftJoin(
			assets,
			and(eq(assets.hospitalId, hospitals.id), eq(assets.tenantId, tenantId))
		)
		.leftJoin(
			jobs,
			and(eq(jobs.hospitalId, hospitals.id), eq(jobs.tenantId, tenantId))
		)
		.leftJoin(
			contracts,
			and(
				eq(contracts.hospitalId, hospitals.id),
				eq(contracts.tenantId, tenantId)
			)
		)
		.where(and(eq(hospitals.tenantId, tenantId), eq(hospitals.isActive, true)))
		.groupBy(
			hospitals.id,
			hospitals.code,
			hospitals.name,
			hospitals.district,
			hospitals.address,
			hospitals.latitude,
			hospitals.longitude,
			hospitals.primaryContactName,
			hospitals.primaryContactEmail,
			hospitals.primaryContactPhone,
			hospitals.regionProvince
		)
		.orderBy(asc(hospitals.name));

	return rows.map((row) => ({
		address: row.address,
		assets: row.assetCount,
		code: row.code,
		contractStatus: row.contractStatus
			? mapContractStatus(row.contractStatus)
			: "Expired",
		district: row.district,
		id: row.id,
		lat: numberFrom(row.latitude),
		lng: numberFrom(row.longitude),
		name: row.name,
		openJobs: row.openJobs,
		primaryContactEmail: row.primaryContactEmail,
		primaryContactName: row.primaryContactName,
		primaryContactPhone: row.primaryContactPhone,
		regionProvince: row.regionProvince,
	}));
};

const getEngineers = async (tenantId: string): Promise<Engineer[]> => {
	const rows = await db
		.select({
			code: engineers.code,
			email: engineers.email,
			grade: engineers.grade,
			hourlyRateHkd: engineers.hourlyRateHkd,
			id: engineers.id,
			mealCapHkd: engineers.mealCapHkd,
			mileageRateHkdPerKm: engineers.mileageRateHkdPerKm,
			name: engineers.name,
			phone: engineers.phone,
			region: engineers.region,
			status: engineers.status,
		})
		.from(engineers)
		.where(
			and(eq(engineers.tenantId, tenantId), ne(engineers.status, "off_duty"))
		)
		.orderBy(asc(engineers.code));
	const engineerIds = rows.map((engineer) => engineer.id);
	const currentJobRows =
		engineerIds.length > 0
			? await db
					.select({
						engineerId: jobs.assignedEngineerId,
						jobNumber: jobs.jobNumber,
					})
					.from(jobs)
					.where(
						and(
							eq(jobs.tenantId, tenantId),
							inArray(jobs.assignedEngineerId, engineerIds),
							ne(jobs.status, "completed"),
							ne(jobs.status, "cancelled")
						)
					)
					.orderBy(desc(jobs.scheduledStartAt))
			: [];
	const currentJobByEngineerId = new Map<string, string>();

	for (const job of currentJobRows) {
		if (job.engineerId && !currentJobByEngineerId.has(job.engineerId)) {
			currentJobByEngineerId.set(job.engineerId, job.jobNumber);
		}
	}

	const locationRows =
		engineerIds.length > 0
			? await db
					.select({
						engineerId: engineerLocations.engineerId,
						latitude: engineerLocations.latitude,
						longitude: engineerLocations.longitude,
						recordedAt: engineerLocations.recordedAt,
					})
					.from(engineerLocations)
					.where(
						and(
							eq(engineerLocations.tenantId, tenantId),
							inArray(engineerLocations.engineerId, engineerIds)
						)
					)
					.orderBy(desc(engineerLocations.recordedAt))
			: [];
	const locationByEngineerId = new Map<
		string,
		{ lat: number; lng: number; recordedAt: string }
	>();

	for (const location of locationRows) {
		if (locationByEngineerId.has(location.engineerId)) {
			continue;
		}

		locationByEngineerId.set(location.engineerId, {
			lat: numberFrom(location.latitude),
			lng: numberFrom(location.longitude),
			recordedAt: formatDateTime(location.recordedAt),
		});
	}

	return rows.map((row) => ({
		code: row.code,
		currentJob: currentJobByEngineerId.get(row.id) ?? "Available",
		email: row.email,
		grade: row.grade,
		hourlyRate: numberFrom(row.hourlyRateHkd),
		id: row.id,
		lat: locationByEngineerId.get(row.id)?.lat ?? null,
		lng: locationByEngineerId.get(row.id)?.lng ?? null,
		locationRecordedAt: locationByEngineerId.get(row.id)?.recordedAt ?? null,
		mealCap: numberFrom(row.mealCapHkd),
		mileageRate: numberFrom(row.mileageRateHkdPerKm),
		name: row.name,
		phone: row.phone,
		region: row.region,
		status: mapEngineerStatus(row.status),
		statusValue: row.status,
	}));
};

const getAssets = async (tenantId: string): Promise<Asset[]> => {
	const rows = await db
		.select({
			assetNumber: assets.assetNumber,
			contractCoverageStatus: assets.contractCoverageStatus,
			designatedEngineerId: assets.designatedEngineerId,
			designatedEngineer: engineers.name,
			hospital: hospitals.name,
			hospitalId: assets.hospitalId,
			installationDate: assets.installationDate,
			locationLabel: assets.locationLabel,
			modelName: productModels.modelName,
			nextPmDueDate: assets.nextPmDueDate,
			nfcUid: assets.nfcUid,
			productModelId: assets.productModelId,
			recordId: assets.id,
			serialNumber: assets.serialNumber,
			warrantyExpiryDate: assets.warrantyExpiryDate,
		})
		.from(assets)
		.innerJoin(
			productModels,
			and(
				eq(productModels.id, assets.productModelId),
				eq(productModels.tenantId, tenantId)
			)
		)
		.innerJoin(
			hospitals,
			and(eq(hospitals.id, assets.hospitalId), eq(hospitals.tenantId, tenantId))
		)
		.leftJoin(engineers, eq(engineers.id, assets.designatedEngineerId))
		.where(and(eq(assets.tenantId, tenantId), eq(assets.isActive, true)))
		.orderBy(asc(assets.assetNumber));

	return rows.map((row) => ({
		contractCoverage: mapCoverage(row.contractCoverageStatus),
		contractCoverageValue: row.contractCoverageStatus,
		designatedEngineer: row.designatedEngineer ?? "Unassigned",
		designatedEngineerId: row.designatedEngineerId,
		hospital: row.hospital,
		hospitalId: row.hospitalId,
		id: row.assetNumber,
		installationDate: dateOnly(row.installationDate),
		location: row.locationLabel,
		model: row.modelName,
		nextPmDue: dateOnly(row.nextPmDueDate),
		nfcUid: row.nfcUid,
		productModelId: row.productModelId,
		recordId: row.recordId,
		serial: row.serialNumber,
		warrantyExpiry: dateOnly(row.warrantyExpiryDate),
	}));
};

const getJobs = async (tenantId: string): Promise<Job[]> => {
	const rows = await db
		.select({
			assetId: jobs.assetId,
			assetNumber: assets.assetNumber,
			audit: jobStateEvents.eventLabel,
			cost: jobCosts.labourCostHkd,
			description: jobs.description,
			engineerId: jobs.assignedEngineerId,
			engineerName: engineers.name,
			hospitalId: jobs.hospitalId,
			hospitalName: hospitals.name,
			jobNumber: jobs.jobNumber,
			nfcUid: assets.nfcUid,
			priority: jobs.priority,
			recordId: jobs.id,
			scheduledStartAt: jobs.scheduledStartAt,
			status: jobs.status,
			timerMinutes: jobTimers.durationMinutes,
			type: jobs.type,
		})
		.from(jobs)
		.innerJoin(assets, eq(assets.id, jobs.assetId))
		.innerJoin(hospitals, eq(hospitals.id, jobs.hospitalId))
		.leftJoin(engineers, eq(engineers.id, jobs.assignedEngineerId))
		.leftJoin(jobTimers, eq(jobTimers.jobId, jobs.id))
		.leftJoin(jobCosts, eq(jobCosts.jobId, jobs.id))
		.leftJoin(jobStateEvents, eq(jobStateEvents.jobId, jobs.id))
		.where(eq(jobs.tenantId, tenantId))
		.orderBy(desc(jobs.scheduledStartAt));

	const seen = new Set<string>();
	const mapped: Job[] = [];

	for (const row of rows) {
		if (seen.has(row.jobNumber)) {
			continue;
		}

		seen.add(row.jobNumber);
		mapped.push({
			asset: row.assetNumber,
			assetId: row.assetId,
			audit: row.audit ?? "No state events recorded",
			cost: Math.round(numberFrom(row.cost)),
			description: row.description,
			engineer: row.engineerName ?? "Unassigned",
			engineerId: row.engineerId,
			hospital: row.hospitalName,
			hospitalId: row.hospitalId,
			id: row.jobNumber,
			nfcUid: row.nfcUid,
			priority: mapPriority(row.priority),
			priorityValue: row.priority,
			recordId: row.recordId,
			scheduledFor: dateLabel(row.scheduledStartAt),
			scheduledStartAt: row.scheduledStartAt?.toISOString() ?? null,
			status: mapJobStatus(row.status),
			statusValue: row.status,
			timerMinutes: row.timerMinutes ?? 0,
			type: mapJobType(row.type),
			typeValue: row.type,
		});
	}

	return mapped;
};

const mapAssetRowToAsset = (row: {
	assetNumber: string;
	contractCoverageStatus: AssetRow["contractCoverageStatus"];
	designatedEngineerId: null | string;
	designatedEngineerName: null | string;
	hospitalId: string;
	hospitalName: string;
	id: string;
	installationDate: null | string;
	locationLabel: string;
	modelName: string;
	nextPmDueDate: null | string;
	nfcUid: string;
	productModelId: string;
	serialNumber: string;
	warrantyExpiryDate: null | string;
}): Asset => ({
	contractCoverage: mapCoverage(row.contractCoverageStatus),
	contractCoverageValue: row.contractCoverageStatus,
	designatedEngineer: row.designatedEngineerName ?? "Unassigned",
	designatedEngineerId: row.designatedEngineerId,
	hospital: row.hospitalName,
	hospitalId: row.hospitalId,
	id: row.assetNumber,
	installationDate: row.installationDate ?? "Not set",
	location: row.locationLabel,
	model: row.modelName,
	nextPmDue: row.nextPmDueDate ?? "Not scheduled",
	nfcUid: row.nfcUid,
	productModelId: row.productModelId,
	recordId: row.id,
	serial: row.serialNumber,
	warrantyExpiry: row.warrantyExpiryDate ?? "Not set",
});

const mapJobRowToJob = (row: {
	assetNumber: string;
	assetRecordId: string;
	assignedEngineerId: null | string;
	description: string;
	hospitalId: string;
	hospitalName: string;
	id: string;
	jobNumber: string;
	name: null | string;
	nfcUid: string;
	priority: JobRow["priority"];
	scheduledStartAt: Date | null;
	status: JobRow["status"];
	timerMinutes: null | number;
	type: JobRow["type"];
}): Job => ({
	asset: row.assetNumber,
	assetId: row.assetRecordId,
	audit: "Audit trail available",
	cost: 0,
	description: row.description,
	engineer: row.name ?? "Unassigned",
	engineerId: row.assignedEngineerId,
	hospital: row.hospitalName,
	hospitalId: row.hospitalId,
	id: row.jobNumber,
	nfcUid: row.nfcUid,
	priority: mapPriority(row.priority),
	priorityValue: row.priority,
	recordId: row.id,
	scheduledFor: dateLabel(row.scheduledStartAt),
	scheduledStartAt: row.scheduledStartAt?.toISOString() ?? null,
	status: mapJobStatus(row.status),
	statusValue: row.status,
	timerMinutes: row.timerMinutes ?? 0,
	type: mapJobType(row.type),
	typeValue: row.type,
});

const getProducts = async (tenantId: string): Promise<ProductModel[]> => {
	const assetCountRows = await db
		.select({
			assetCount: sql<number>`count(*)::int`,
			productModelId: assets.productModelId,
		})
		.from(assets)
		.where(eq(assets.tenantId, tenantId))
		.groupBy(assets.productModelId);
	const assetCounts = new Map(
		assetCountRows.map((row) => [row.productModelId, Number(row.assetCount)])
	);
	const rows = await db
		.select({
			category: productModels.category,
			code: productModels.code,
			defaultPmCycleMonths: productModels.defaultPmCycleMonths,
			isEngineerReadOnly: productModels.isEngineerReadOnly,
			manufacturer: productModels.manufacturer,
			manualFileName: serviceManuals.fileName,
			manualFileUrl: serviceManuals.fileUrl,
			modelName: productModels.modelName,
			partId: parts.id,
			partName: parts.name,
			productModelId: productModels.id,
		})
		.from(productModels)
		.leftJoin(
			productModelParts,
			eq(productModelParts.productModelId, productModels.id)
		)
		.leftJoin(parts, eq(parts.id, productModelParts.partId))
		.leftJoin(
			serviceManuals,
			eq(serviceManuals.productModelId, productModels.id)
		)
		.where(eq(productModels.tenantId, tenantId))
		.orderBy(asc(productModels.modelName));

	const byModel = new Map<string, ProductModel>();

	for (const row of rows) {
		const existing = byModel.get(row.productModelId);

		if (existing) {
			if (row.partName) {
				existing.partsList.push(row.partName);
			}
			if (row.partId) {
				existing.partIds.push(row.partId);
			}

			continue;
		}

		byModel.set(row.productModelId, {
			assetCount: assetCounts.get(row.productModelId) ?? 0,
			category: row.category,
			code: row.code,
			defaultPmCycleMonths: row.defaultPmCycleMonths,
			engineerAccess: row.isEngineerReadOnly ? "Read-only" : "Editable",
			id: row.productModelId,
			isEngineerReadOnly: row.isEngineerReadOnly,
			manufacturer: row.manufacturer,
			manualFileName: row.manualFileName ?? "Not uploaded",
			manualFileUrl: row.manualFileUrl,
			modelName: row.modelName,
			partIds: row.partId ? [row.partId] : [],
			partsList: row.partName ? [row.partName] : [],
		});
	}

	return Array.from(byModel.values());
};

interface ContractCoverageRow {
	accountManagerName: string;
	contractId: string;
	contractNumber: string;
	endDate: string;
	hospitalId: string;
	hospitalName: string;
	modelName: null | string;
	partId: null | string;
	partName: null | string;
	productModelId: null | string;
	responseSlaHours: number;
	startDate: string;
	status: ContractRow["status"];
	type: ContractRow["type"];
}

const appendUnique = (values: string[], value: null | string): void => {
	if (!(value && !values.includes(value))) {
		return;
	}

	values.push(value);
};

const addContractCoverage = (
	contract: Contract,
	row: ContractCoverageRow
): void => {
	appendUnique(contract.coveredModels, row.modelName);
	appendUnique(contract.coveredModelIds, row.productModelId);
	appendUnique(contract.coveredParts, row.partName);
	appendUnique(contract.coveredPartIds, row.partId);
};

const contractFromRow = (row: ContractCoverageRow): Contract => ({
	accountManager: row.accountManagerName,
	coveredModelIds: row.productModelId ? [row.productModelId] : [],
	coveredModels: row.modelName ? [row.modelName] : [],
	coveredPartIds: row.partId ? [row.partId] : [],
	coveredParts: row.partName ? [row.partName] : [],
	expiry: row.endDate,
	hospital: row.hospitalName,
	hospitalId: row.hospitalId,
	id: row.contractNumber,
	recordId: row.contractId,
	slaHours: row.responseSlaHours,
	startDate: row.startDate,
	status: mapContractStatus(row.status),
	statusValue: row.status,
	type: mapContractType(row.type),
	typeValue: row.type,
});

const getContracts = async (tenantId: string): Promise<Contract[]> => {
	const rows = await db
		.select({
			accountManagerName: contracts.accountManagerName,
			contractNumber: contracts.contractNumber,
			contractId: contracts.id,
			endDate: contracts.endDate,
			hospitalId: contracts.hospitalId,
			hospitalName: hospitals.name,
			modelName: productModels.modelName,
			partId: parts.id,
			partName: parts.name,
			productModelId: productModels.id,
			responseSlaHours: contracts.responseSlaHours,
			startDate: contracts.startDate,
			status: contracts.status,
			type: contracts.type,
		})
		.from(contracts)
		.innerJoin(hospitals, eq(hospitals.id, contracts.hospitalId))
		.leftJoin(
			contractModelCoverage,
			eq(contractModelCoverage.contractId, contracts.id)
		)
		.leftJoin(
			productModels,
			eq(productModels.id, contractModelCoverage.productModelId)
		)
		.leftJoin(
			contractPartCoverage,
			eq(contractPartCoverage.contractId, contracts.id)
		)
		.leftJoin(parts, eq(parts.id, contractPartCoverage.partId))
		.where(eq(contracts.tenantId, tenantId))
		.orderBy(asc(contracts.contractNumber));

	const byContract = new Map<string, Contract>();

	for (const row of rows) {
		const existing = byContract.get(row.contractNumber);

		if (existing) {
			addContractCoverage(existing, row);
			continue;
		}

		byContract.set(row.contractNumber, contractFromRow(row));
	}

	return Array.from(byContract.values());
};

const getFaultReports = async (tenantId: string): Promise<FaultReport[]> => {
	const rows = await db
		.select({
			assetId: faultReports.assetId,
			assetNumber: assets.assetNumber,
			createdAt: faultReports.createdAt,
			description: faultReports.description,
			hospitalId: faultReports.hospitalId,
			hospitalName: hospitals.name,
			reportNumber: faultReports.reportNumber,
			recordId: faultReports.id,
			severity: faultReports.severity,
			status: faultReports.status,
			submittedByContact: faultReports.submittedByContact,
			submittedByName: faultReports.submittedByName,
		})
		.from(faultReports)
		.innerJoin(hospitals, eq(hospitals.id, faultReports.hospitalId))
		.leftJoin(assets, eq(assets.id, faultReports.assetId))
		.where(eq(faultReports.tenantId, tenantId))
		.orderBy(desc(faultReports.createdAt));

	return rows.map((row) => ({
		asset: row.assetNumber ?? "Manual lookup",
		assetId: row.assetId,
		description: row.description,
		hospital: row.hospitalName,
		hospitalId: row.hospitalId,
		id: row.reportNumber,
		recordId: row.recordId,
		severity: mapSeverity(row.severity),
		severityValue: row.severity,
		status: mapFaultStatus(row.status),
		statusValue: row.status,
		submittedByContact: row.submittedByContact,
		submittedByName: row.submittedByName,
		submittedAt: dateLabel(row.createdAt),
	}));
};

const getParts = async (tenantId: string): Promise<Part[]> => {
	const rows = await db
		.select({
			description: parts.description,
			minimumStock: partInventory.minimumStock,
			name: parts.name,
			partNumber: parts.partNumber,
			productModelId: productModelParts.productModelId,
			recordId: parts.id,
			stockOnHand: partInventory.stockOnHand,
			supplier: parts.supplier,
			unitCostHkd: parts.unitCostHkd,
		})
		.from(parts)
		.leftJoin(partInventory, eq(partInventory.partId, parts.id))
		.leftJoin(productModelParts, eq(productModelParts.partId, parts.id))
		.where(and(eq(parts.tenantId, tenantId), eq(parts.isActive, true)))
		.orderBy(asc(parts.partNumber));

	const byPart = new Map<string, Part>();

	for (const row of rows) {
		const existing = byPart.get(row.recordId);

		if (existing) {
			appendUnique(existing.productModelIds, row.productModelId);
			continue;
		}

		byPart.set(row.recordId, {
			description: row.description,
			id: row.partNumber,
			minimum: row.minimumStock ?? 0,
			name: row.name,
			productModelIds: row.productModelId ? [row.productModelId] : [],
			recordId: row.recordId,
			stock: row.stockOnHand ?? 0,
			supplier: row.supplier,
			unitCost: numberFrom(row.unitCostHkd),
		});
	}

	return Array.from(byPart.values());
};

const mapShortageStatus = (
	status: typeof partsShortages.$inferSelect.status
): ServiceOpsSnapshot["shortages"][number]["status"] => {
	if (status === "arrived") {
		return "Arrived";
	}

	if (status === "reschedule_ready") {
		return "Reschedule ready";
	}

	return "Waiting for parts";
};

const getShortages = async (
	tenantId: string
): Promise<ServiceOpsSnapshot["shortages"]> => {
	const rows = await db
		.select({
			engineerName: engineers.name,
			jobNumber: jobs.jobNumber,
			jobRecordId: jobs.id,
			partId: parts.id,
			partName: parts.name,
			recordId: partsShortages.id,
			shortageNumber: partsShortages.shortageNumber,
			status: partsShortages.status,
		})
		.from(partsShortages)
		.innerJoin(jobs, eq(jobs.id, partsShortages.jobId))
		.innerJoin(parts, eq(parts.id, partsShortages.partId))
		.leftJoin(engineers, eq(engineers.id, partsShortages.engineerId))
		.where(eq(partsShortages.tenantId, tenantId))
		.orderBy(desc(partsShortages.reportedAt));

	return rows.map((row) => ({
		engineer: row.engineerName ?? "Back Office",
		id: row.shortageNumber,
		job: row.jobNumber,
		jobId: row.jobRecordId,
		part: row.partName,
		partId: row.partId,
		recordId: row.recordId,
		status: mapShortageStatus(row.status),
	}));
};

const getManualAnswers = async (tenantId: string): Promise<ManualAnswer[]> => {
	const rows = await db
		.select({
			content: serviceManualSections.content,
			id: serviceManualSections.id,
			pageNumber: serviceManualSections.pageNumber,
			sectionTitle: serviceManualSections.sectionTitle,
		})
		.from(serviceManualSections)
		.where(eq(serviceManualSections.tenantId, tenantId))
		.orderBy(asc(serviceManualSections.pageNumber))
		.limit(5);

	return rows.map((row) => ({
		excerpt: row.content,
		id: row.id,
		page: row.pageNumber,
		title: row.sectionTitle,
	}));
};

const manualSearchTerms = (question: string): string[] => {
	const normalizedTerms = question
		.toLowerCase()
		.split(manualQuestionTermRegex)
		.map((term) => term.trim())
		.filter((term) => term.length >= 3);

	return Array.from(new Set(normalizedTerms)).slice(0, 8);
};

const summarizeManualAnswers = (answers: ManualAnswer[]): string => {
	if (answers.length === 0) {
		return "No matching manual sections were found.";
	}

	return answers
		.map((answer) => `Page ${answer.page}: ${answer.title}`)
		.join(" | ");
};

export async function askServiceManualQuestion(
	tenantId: string,
	input: ManualQuestionInput
): Promise<ManualQuestionResult> {
	const asset = input.assetId
		? await getTenantAssetRecord(tenantId, input.assetId)
		: null;
	const job = input.jobId
		? await getTenantJobRecord(tenantId, input.jobId)
		: null;
	const assetId = asset?.id ?? job?.assetId ?? null;

	if (input.engineerId) {
		await getTenantEngineerRecord(tenantId, input.engineerId);
	}

	const targetAsset = assetId
		? await getTenantAssetRecord(tenantId, assetId)
		: null;
	const manualRows = await db
		.select({ id: serviceManuals.id })
		.from(serviceManuals)
		.where(
			targetAsset
				? and(
						eq(serviceManuals.tenantId, tenantId),
						eq(serviceManuals.productModelId, targetAsset.productModelId)
					)
				: eq(serviceManuals.tenantId, tenantId)
		)
		.orderBy(desc(serviceManuals.uploadedAt))
		.limit(targetAsset ? 1 : 10);
	const manualIds = manualRows.map((manual) => manual.id);
	const terms = manualSearchTerms(input.question);
	const whereClauses = [
		eq(serviceManualSections.tenantId, tenantId),
		manualIds.length > 0
			? inArray(serviceManualSections.manualId, manualIds)
			: undefined,
		terms.length > 0
			? or(
					...terms.flatMap((term) => [
						ilike(serviceManualSections.sectionTitle, `%${term}%`),
						ilike(serviceManualSections.content, `%${term}%`),
					])
				)
			: undefined,
	].filter(Boolean);
	const rows = await db
		.select({
			content: serviceManualSections.content,
			id: serviceManualSections.id,
			pageNumber: serviceManualSections.pageNumber,
			sectionTitle: serviceManualSections.sectionTitle,
		})
		.from(serviceManualSections)
		.where(and(...whereClauses))
		.orderBy(asc(serviceManualSections.pageNumber))
		.limit(3);
	const answers = rows.map((row) => ({
		excerpt: row.content,
		id: row.id,
		page: row.pageNumber,
		title: row.sectionTitle,
	}));
	const summary = summarizeManualAnswers(answers);
	const [query] = await db
		.insert(manualQaQueries)
		.values({
			answerSummary: summary,
			assetId,
			engineerId: input.engineerId ?? null,
			jobId: job?.id ?? null,
			manualId: manualIds[0] ?? null,
			question: input.question,
			tenantId,
			topSectionIds: answers.map((answer) => answer.id),
		})
		.returning({ id: manualQaQueries.id });

	return {
		answers,
		queryId: query?.id ?? "",
		summary,
	};
}

const getSystemParameters = async (
	tenantId: string
): Promise<SystemParameter[]> => {
	const rows = await db
		.select()
		.from(systemParameters)
		.where(eq(systemParameters.tenantId, tenantId))
		.orderBy(asc(systemParameters.key));

	return rows.map((row) => ({
		id: row.key,
		label: parameterLabel(row.key),
		value: formatParameterValue(row.key, row.value),
		valueRaw: row.value,
		valueType: row.valueType,
	}));
};

const getCostRecords = async (tenantId: string): Promise<CostRecord[]> => {
	const rows = await db
		.select({
			jobNumber: jobs.jobNumber,
			labourCostHkd: jobCosts.labourCostHkd,
			mealCostHkd: jobCosts.mealCostHkd,
			mileageCostHkd: jobCosts.mileageCostHkd,
			partsAbsorbedHkd: jobCosts.partsAbsorbedHkd,
			partsBillableHkd: jobCosts.partsBillableHkd,
		})
		.from(jobCosts)
		.innerJoin(jobs, eq(jobs.id, jobCosts.jobId))
		.where(eq(jobCosts.tenantId, tenantId))
		.orderBy(desc(jobCosts.calculatedAt));

	return rows.map((row) => ({
		id: `${row.jobNumber}-cost`,
		job: row.jobNumber,
		labour: formatMoney(row.labourCostHkd),
		meals: formatMoney(row.mealCostHkd),
		mileage: formatMoney(row.mileageCostHkd),
		partsAbsorbed: formatMoney(row.partsAbsorbedHkd),
		partsBillable: formatMoney(row.partsBillableHkd),
	}));
};

const getReportMetrics = async (tenantId: string): Promise<ReportMetric[]> => {
	const [snapshot] = await db
		.select()
		.from(reportSnapshots)
		.where(eq(reportSnapshots.tenantId, tenantId))
		.orderBy(desc(reportSnapshots.createdAt))
		.limit(1);

	const metrics = snapshot?.metrics as
		| {
				averageResolutionHours?: number;
				billablePartsHkd?: number;
				firstFixRate?: number;
				jobsCompleted?: number;
		  }
		| undefined;
	const hasSnapshot = Boolean(metrics);

	return [
		{
			id: "jobs",
			label: "Jobs completed",
			value: String(metrics?.jobsCompleted ?? 0),
			trend: hasSnapshot ? "Latest report snapshot" : "No completed jobs yet",
		},
		{
			id: "resolution",
			label: "Avg resolution",
			value: `${metrics?.averageResolutionHours ?? 0}h`,
			trend: hasSnapshot
				? "Latest report snapshot"
				: "No resolution history yet",
		},
		{
			id: "firstFix",
			label: "First-fix rate",
			value: `${Math.round((metrics?.firstFixRate ?? 0) * 100)}%`,
			trend: hasSnapshot ? "Latest report snapshot" : "No first-fix sample yet",
		},
		{
			id: "cost",
			label: "Billable parts",
			value: formatMoney(String(metrics?.billablePartsHkd ?? 0)),
			trend: hasSnapshot ? "Latest report snapshot" : "No billable parts yet",
		},
	];
};

const getJobReportMetrics = async (tenantId: string) => {
	const [completedJobs] = await db
		.select({
			averageResolutionHours:
				sql<number>`coalesce(avg(extract(epoch from (${jobs.actualCompletedAt} - ${jobs.actualStartedAt})) / 3600), 0)`.mapWith(
					Number
				),
			jobsCompleted: sql<number>`count(*)`.mapWith(Number),
		})
		.from(jobs)
		.where(and(eq(jobs.tenantId, tenantId), eq(jobs.status, "completed")));
	const [billableParts] = await db
		.select({
			total:
				sql<number>`coalesce(sum(${jobPartsUsage.quantity} * ${jobPartsUsage.unitCostHkd}) filter (where ${jobPartsUsage.isBillable} = true), 0)`.mapWith(
					Number
				),
		})
		.from(jobPartsUsage)
		.where(eq(jobPartsUsage.tenantId, tenantId));

	return {
		averageResolutionHours: Number(
			(completedJobs?.averageResolutionHours ?? 0).toFixed(1)
		),
		billablePartsHkd: billableParts?.total ?? 0,
		firstFixRate: completedJobs?.jobsCompleted ? 1 : 0,
		jobsCompleted: completedJobs?.jobsCompleted ?? 0,
	};
};

export async function getNfcDeviceInfo(
	tenantId: string,
	nfcUid: string
): Promise<NfcDeviceInfo> {
	const asset = await getTenantAssetByNfcUid(tenantId, nfcUid);
	const [assetRow] = await db
		.select({
			assetNumber: assets.assetNumber,
			contractCoverageStatus: assets.contractCoverageStatus,
			designatedEngineerId: assets.designatedEngineerId,
			designatedEngineerName: engineers.name,
			hospitalId: assets.hospitalId,
			hospitalName: hospitals.name,
			id: assets.id,
			installationDate: assets.installationDate,
			locationLabel: assets.locationLabel,
			modelName: productModels.modelName,
			nextPmDueDate: assets.nextPmDueDate,
			nfcUid: assets.nfcUid,
			productCategory: productModels.category,
			productCode: productModels.code,
			productDefaultPmCycleMonths: productModels.defaultPmCycleMonths,
			productIsEngineerReadOnly: productModels.isEngineerReadOnly,
			productManufacturer: productModels.manufacturer,
			productModelId: assets.productModelId,
			serialNumber: assets.serialNumber,
			warrantyExpiryDate: assets.warrantyExpiryDate,
		})
		.from(assets)
		.innerJoin(hospitals, eq(hospitals.id, assets.hospitalId))
		.innerJoin(productModels, eq(productModels.id, assets.productModelId))
		.leftJoin(engineers, eq(engineers.id, assets.designatedEngineerId))
		.where(and(eq(assets.id, asset.id), eq(assets.tenantId, tenantId)))
		.limit(1);

	if (!assetRow) {
		throw new Error("Asset record was not found for this NFC tag");
	}

	const jobRows = await db
		.select({
			assetNumber: assets.assetNumber,
			assetRecordId: assets.id,
			assignedEngineerId: jobs.assignedEngineerId,
			description: jobs.description,
			hospitalId: jobs.hospitalId,
			hospitalName: hospitals.name,
			id: jobs.id,
			jobNumber: jobs.jobNumber,
			name: engineers.name,
			nfcUid: assets.nfcUid,
			priority: jobs.priority,
			scheduledStartAt: jobs.scheduledStartAt,
			status: jobs.status,
			timerMinutes:
				sql<number>`coalesce(sum(${jobTimers.durationMinutes}), 0)`.mapWith(
					Number
				),
			type: jobs.type,
		})
		.from(jobs)
		.innerJoin(assets, eq(assets.id, jobs.assetId))
		.innerJoin(hospitals, eq(hospitals.id, jobs.hospitalId))
		.leftJoin(engineers, eq(engineers.id, jobs.assignedEngineerId))
		.leftJoin(jobTimers, eq(jobTimers.jobId, jobs.id))
		.where(and(eq(jobs.tenantId, tenantId), eq(jobs.assetId, asset.id)))
		.groupBy(
			jobs.id,
			jobs.jobNumber,
			jobs.type,
			jobs.status,
			jobs.priority,
			jobs.description,
			jobs.scheduledStartAt,
			jobs.assignedEngineerId,
			assets.assetNumber,
			assets.nfcUid,
			hospitals.name,
			jobs.hospitalId,
			engineers.name
		)
		.orderBy(desc(jobs.createdAt))
		.limit(6);
	const jobsForAsset = jobRows.map(mapJobRowToJob);
	const currentOpenJob =
		jobsForAsset.find(
			(job) => job.status !== "Completed" && job.status !== "Cancelled"
		) ?? null;
	const lastServiceRecords = jobsForAsset
		.filter((job) => job.status === "Completed")
		.slice(0, 3);
	const [manual] = await db
		.select({
			fileName: serviceManuals.fileName,
			fileUrl: serviceManuals.fileUrl,
			pageCount: serviceManuals.pageCount,
			version: serviceManuals.version,
		})
		.from(serviceManuals)
		.where(
			and(
				eq(serviceManuals.tenantId, tenantId),
				eq(serviceManuals.productModelId, asset.productModelId)
			)
		)
		.orderBy(desc(serviceManuals.uploadedAt))
		.limit(1);

	await db.insert(nfcEvents).values({
		accepted: true,
		assetId: asset.id,
		eventType: "scanned_for_info",
		expectedUid: asset.nfcUid,
		readUid: nfcUid,
		tenantId,
	});

	return {
		asset: mapAssetRowToAsset(assetRow),
		contractCoverageStatus: mapCoverage(asset.contractCoverageStatus),
		currentOpenJob,
		lastServiceRecords,
		manualFileUrl: manual?.fileUrl ?? null,
		productModel: {
			assetCount: 1,
			category: assetRow.productCategory,
			code: assetRow.productCode,
			defaultPmCycleMonths: assetRow.productDefaultPmCycleMonths,
			engineerAccess: assetRow.productIsEngineerReadOnly
				? "Read-only"
				: "Editable",
			id: asset.productModelId,
			isEngineerReadOnly: assetRow.productIsEngineerReadOnly,
			manualFileName: manual?.fileName ?? "Not uploaded",
			manualFileUrl: manual?.fileUrl ?? null,
			manufacturer: assetRow.productManufacturer,
			modelName: assetRow.modelName,
			partIds: [],
			partsList: [],
		},
	};
}

const getJobCostInputs = async (tenantId: string, jobId: string) => {
	const [job] = await db
		.select({
			engineerId: jobs.assignedEngineerId,
			hourlyRateHkd: engineers.hourlyRateHkd,
		})
		.from(jobs)
		.leftJoin(engineers, eq(engineers.id, jobs.assignedEngineerId))
		.where(and(eq(jobs.id, jobId), eq(jobs.tenantId, tenantId)))
		.limit(1);

	if (!job) {
		throw new Error("Job record was not found for this tenant");
	}

	const [timerTotals] = await db
		.select({
			minutes:
				sql<number>`coalesce(sum(${jobTimers.durationMinutes}), 0)`.mapWith(
					Number
				),
		})
		.from(jobTimers)
		.where(and(eq(jobTimers.jobId, jobId), eq(jobTimers.tenantId, tenantId)));
	const [expenseTotals] = await db
		.select({
			meals:
				sql<number>`coalesce(sum(${jobExpenses.amountHkd}) filter (where ${jobExpenses.type} = 'meal'), 0)`.mapWith(
					Number
				),
			mileage:
				sql<number>`coalesce(sum(${jobExpenses.amountHkd}) filter (where ${jobExpenses.type} = 'mileage'), 0)`.mapWith(
					Number
				),
		})
		.from(jobExpenses)
		.where(
			and(eq(jobExpenses.jobId, jobId), eq(jobExpenses.tenantId, tenantId))
		);
	const [partTotals] = await db
		.select({
			absorbed:
				sql<number>`coalesce(sum(${jobPartsUsage.quantity} * ${jobPartsUsage.unitCostHkd}) filter (where ${jobPartsUsage.isBillable} = false), 0)`.mapWith(
					Number
				),
			billable:
				sql<number>`coalesce(sum(${jobPartsUsage.quantity} * ${jobPartsUsage.unitCostHkd}) filter (where ${jobPartsUsage.isBillable} = true), 0)`.mapWith(
					Number
				),
		})
		.from(jobPartsUsage)
		.where(
			and(eq(jobPartsUsage.jobId, jobId), eq(jobPartsUsage.tenantId, tenantId))
		);

	return {
		engineerId: job.engineerId,
		labourMinutes: timerTotals?.minutes ?? 0,
		labourRate: numberFrom(job.hourlyRateHkd),
		meals: expenseTotals?.meals ?? 0,
		mileage: expenseTotals?.mileage ?? 0,
		partsAbsorbed: partTotals?.absorbed ?? 0,
		partsBillable: partTotals?.billable ?? 0,
	};
};

export async function recalculateJobCost(tenantId: string, jobId: string) {
	await getTenantJobRecord(tenantId, jobId);
	const inputs = await getJobCostInputs(tenantId, jobId);
	const labourCost =
		(inputs.labourMinutes / minutesPerHour) * inputs.labourRate;
	const totalInternalCost =
		labourCost + inputs.mileage + inputs.meals + inputs.partsAbsorbed;

	await db
		.insert(jobCosts)
		.values({
			calculatedAt: new Date(),
			jobId,
			labourCostHkd: toMoneyValue(labourCost),
			labourMinutes: inputs.labourMinutes,
			labourRateHkd: toMoneyValue(inputs.labourRate),
			mealCostHkd: toMoneyValue(inputs.meals),
			mileageCostHkd: toMoneyValue(inputs.mileage),
			partsAbsorbedHkd: toMoneyValue(inputs.partsAbsorbed),
			partsBillableHkd: toMoneyValue(inputs.partsBillable),
			tenantId,
			totalBillableHkd: toMoneyValue(inputs.partsBillable),
			totalInternalCostHkd: toMoneyValue(totalInternalCost),
		})
		.onConflictDoUpdate({
			set: {
				calculatedAt: new Date(),
				labourCostHkd: toMoneyValue(labourCost),
				labourMinutes: inputs.labourMinutes,
				labourRateHkd: toMoneyValue(inputs.labourRate),
				mealCostHkd: toMoneyValue(inputs.meals),
				mileageCostHkd: toMoneyValue(inputs.mileage),
				partsAbsorbedHkd: toMoneyValue(inputs.partsAbsorbed),
				partsBillableHkd: toMoneyValue(inputs.partsBillable),
				totalBillableHkd: toMoneyValue(inputs.partsBillable),
				totalInternalCostHkd: toMoneyValue(totalInternalCost),
			},
			target: jobCosts.jobId,
		});

	await createWebsocketEvent({
		entityId: jobId,
		entityType: "job",
		eventType: "cost.recalculated",
		tenantId,
	});
}

const getDashboardStats = (
	engineerRows: Engineer[],
	faultRows: FaultReport[],
	contractRows: Contract[],
	jobRows: Job[]
): DashboardStat[] => {
	const openJobs = jobRows.filter(
		(job) => job.status !== "Completed" && job.status !== "Cancelled"
	);
	const urgentJobs = openJobs.filter((job) => job.priority === "Urgent");
	const activeEngineers = engineerRows.filter(
		(engineer) => engineer.status !== "Off duty"
	);
	const seriousFaults = faultRows.filter((fault) =>
		["High", "Critical"].includes(fault.severity)
	);
	const contractWarnings = contractRows.filter(
		(contract) => contract.status !== "Active"
	);

	return [
		{
			id: "open-jobs",
			label: "Open jobs",
			value: String(openJobs.length),
			meta: `${urgentJobs.length} urgent, ${openJobs.filter((job) => job.status === "Timer Anomaly").length} anomaly`,
		},
		{
			id: "engineers",
			label: "Active engineers",
			value: `${activeEngineers.length}/${engineerRows.length}`,
			meta: "GPS updates every 2 min",
		},
		{
			id: "faults",
			label: "Fault reports",
			value: String(faultRows.length),
			meta: `${seriousFaults.length} high or critical`,
		},
		{
			id: "contracts",
			label: "Contract warnings",
			value: String(contractWarnings.length),
			meta: "30-day warning window",
		},
	];
};

const getLiveAlerts = async (tenantId: string): Promise<LiveAlert[]> => {
	const [geofence] = await db
		.select({
			engineerName: engineers.name,
			jobNumber: jobs.jobNumber,
			hospitalName: hospitals.name,
		})
		.from(geofenceEvents)
		.innerJoin(jobs, eq(jobs.id, geofenceEvents.jobId))
		.innerJoin(engineers, eq(engineers.id, geofenceEvents.engineerId))
		.innerJoin(hospitals, eq(hospitals.id, geofenceEvents.hospitalId))
		.where(
			and(
				eq(geofenceEvents.tenantId, tenantId),
				eq(geofenceEvents.eventType, "timer_anomaly")
			)
		)
		.orderBy(desc(geofenceEvents.createdAt))
		.limit(1);
	const [pmAlert] = await db
		.select({
			assetNumber: assets.assetNumber,
			engineerName: engineers.name,
			hospitalName: hospitals.name,
			id: opportunisticPmAlerts.id,
		})
		.from(opportunisticPmAlerts)
		.innerJoin(engineers, eq(engineers.id, opportunisticPmAlerts.engineerId))
		.innerJoin(assets, eq(assets.id, opportunisticPmAlerts.assetId))
		.innerJoin(hospitals, eq(hospitals.id, assets.hospitalId))
		.where(
			and(
				eq(opportunisticPmAlerts.tenantId, tenantId),
				eq(opportunisticPmAlerts.status, "open")
			)
		)
		.orderBy(desc(opportunisticPmAlerts.createdAt))
		.limit(1);
	const [contractWarning] = await db
		.select({
			endDate: contracts.endDate,
			hospitalName: hospitals.name,
		})
		.from(contracts)
		.innerJoin(hospitals, eq(hospitals.id, contracts.hospitalId))
		.where(
			and(
				eq(contracts.tenantId, tenantId),
				inArray(contracts.status, ["expiring", "expired"])
			)
		)
		.orderBy(asc(contracts.endDate))
		.limit(1);

	const alerts: LiveAlert[] = [];

	if (geofence) {
		alerts.push({
			id: "alert-anomaly",
			title: "Timer anomaly",
			message: `${geofence.engineerName} left ${geofence.hospitalName} while ${geofence.jobNumber} timer is running.`,
			type: "geofence",
		});
	}

	if (pmAlert) {
		alerts.push({
			actionId: pmAlert.id,
			id: "alert-pm",
			title: "PM opportunity",
			message: `${pmAlert.engineerName} is on-site at ${pmAlert.hospitalName}. ${pmAlert.assetNumber} PM is due soon.`,
			type: "pm",
		});
	}

	if (contractWarning) {
		alerts.push({
			id: "alert-contract",
			title: "Contract expiry",
			message: `${contractWarning.hospitalName} contract expires on ${contractWarning.endDate}.`,
			type: "contract",
		});
	}

	return alerts;
};

export async function getServiceOpsSnapshot(
	tenantId: string,
	userId?: string
): Promise<ServiceOpsSnapshot> {
	const tenant = await getTenant(tenantId);
	const access = userId
		? await getTenantAccessPolicy(userId, tenantId)
		: {
				canManageTenantUsers: false,
				canManageTenants: false,
				canRead: true,
				canWrite: false,
				role: "observer" as const,
			};

	if (!access) {
		throw new Error("Tenant access denied");
	}

	const [
		hospitalRows,
		engineerRows,
		assetRows,
		jobRows,
		productRows,
		contractRows,
		faultRows,
		partRows,
		shortageRows,
		manualRows,
		parameterRows,
		costRows,
		reportRows,
		liveAlertRows,
		tenantRows,
		userRows,
	] = await Promise.all([
		getHospitals(tenantId),
		getEngineers(tenantId),
		getAssets(tenantId),
		getJobs(tenantId),
		getProducts(tenantId),
		getContracts(tenantId),
		getFaultReports(tenantId),
		getParts(tenantId),
		getShortages(tenantId),
		getManualAnswers(tenantId),
		getSystemParameters(tenantId),
		getCostRecords(tenantId),
		getReportMetrics(tenantId),
		getLiveAlerts(tenantId),
		userId ? getTenantsForUser(userId) : Promise.resolve([]),
		access.canManageTenantUsers
			? getTenantUsers(tenantId)
			: Promise.resolve([]),
	]);

	return {
		access,
		assets: assetRows,
		contracts: contractRows,
		costRecords: costRows,
		dashboardStats: getDashboardStats(
			engineerRows,
			faultRows,
			contractRows,
			jobRows
		),
		engineers: engineerRows,
		faultReports: faultRows,
		hospitals: hospitalRows,
		jobs: jobRows,
		liveAlerts: liveAlertRows,
		manualAnswers: manualRows,
		parts: partRows,
		products: productRows,
		reportMetrics: reportRows,
		shortages: shortageRows,
		systemParameters: parameterRows,
		tenant: {
			id: tenant.id,
			name: tenant.name,
			region: tenant.region,
			release: tenant.releaseLabel,
		},
		tenants: tenantRows,
		users: userRows,
	};
}

export async function createTenantForUser(
	userId: string,
	input: TenantMutationInput
) {
	const tenantId = toTenantId(input.id || input.name);

	await db.transaction(async (tx) => {
		await tx.insert(tenants).values({
			id: tenantId,
			isActive: input.isActive,
			name: input.name,
			region: input.region,
			releaseLabel: input.releaseLabel,
		} satisfies TenantInsert);

		await tx.insert(tenantMemberships).values({
			permissions: ["*"],
			role: "tenant_admin",
			status: "active",
			tenantId,
			userId,
		});

		await tx
			.insert(systemParameters)
			.values(
				defaultSystemParameters.map((parameter) => ({
					description: parameter.description,
					key: parameter.key,
					tenantId,
					value: parameter.value,
					valueType: parameter.valueType,
				}))
			)
			.onConflictDoNothing();
	});

	return tenantId;
}

export async function updateTenant(
	tenantId: string,
	input: TenantMutationInput
) {
	await getTenantRecord(tenantId);
	await db
		.update(tenants)
		.set({
			isActive: input.isActive,
			name: input.name,
			region: input.region,
			releaseLabel: input.releaseLabel,
		})
		.where(eq(tenants.id, tenantId));
}

export async function deleteTenant(tenantId: string) {
	if (tenantId === platformTenantId) {
		throw new Error("The platform administration tenant cannot be deactivated");
	}

	await getTenantRecord(tenantId);
	await db
		.update(tenants)
		.set({ isActive: false })
		.where(eq(tenants.id, tenantId));
}

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const credentialProviderId = "credential";

const getTenantUserPermissions = (role: TenantUserMutationInput["role"]) =>
	role === "tenant_admin" || role === "operator" ? ["write"] : [];

const resetCredentialPassword = async (
	userId: string,
	password: string,
	now: Date
) => {
	await db
		.delete(account)
		.where(
			and(
				eq(account.userId, userId),
				eq(account.providerId, credentialProviderId)
			)
		);
	await db.insert(account).values({
		accountId: userId,
		createdAt: now,
		id: randomUUID(),
		password: await hashPassword(password),
		providerId: credentialProviderId,
		updatedAt: now,
		userId,
	});
};

const upsertCredentialUser = async (input: TenantUserMutationInput) => {
	const email = normalizeEmail(input.email);
	const now = new Date();
	const [existingUser] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, email))
		.limit(1);
	const userId = existingUser?.id ?? randomUUID();

	if (existingUser) {
		await db
			.update(user)
			.set({ name: input.name, updatedAt: now })
			.where(eq(user.id, userId));
	} else {
		await db.insert(user).values({
			createdAt: now,
			email,
			emailVerified: true,
			id: userId,
			name: input.name,
			updatedAt: now,
		} satisfies UserInsert);
	}

	if (input.password) {
		await resetCredentialPassword(userId, input.password, now);
	}

	return userId;
};

const updateCredentialUser = async (
	userId: string,
	input: TenantUserMutationInput
) => {
	const now = new Date();

	await db
		.update(user)
		.set({
			email: normalizeEmail(input.email),
			name: input.name,
			updatedAt: now,
		})
		.where(eq(user.id, userId));

	if (input.password) {
		await resetCredentialPassword(userId, input.password, now);
	}
};

export async function createTenantUser(
	tenantId: string,
	input: TenantUserMutationInput
) {
	await getTenantRecord(tenantId);
	const userId = await upsertCredentialUser(input);

	await db
		.insert(tenantMemberships)
		.values({
			permissions: getTenantUserPermissions(input.role),
			role: input.role,
			status: input.status,
			tenantId,
			userId,
		})
		.onConflictDoUpdate({
			set: {
				permissions: getTenantUserPermissions(input.role),
				role: input.role,
				status: input.status,
				updatedAt: new Date(),
			},
			target: [tenantMemberships.tenantId, tenantMemberships.userId],
		});
}

export async function updateTenantUser(
	tenantId: string,
	userId: string,
	input: TenantUserMutationInput
) {
	const [membership] = await db
		.select({ id: tenantMemberships.id, role: tenantMemberships.role })
		.from(tenantMemberships)
		.where(
			and(
				eq(tenantMemberships.tenantId, tenantId),
				eq(tenantMemberships.userId, userId)
			)
		)
		.limit(1);

	if (!membership) {
		throw new Error("User membership was not found for this tenant");
	}

	if (membership.role === "super_admin") {
		throw new Error("Super administrator membership cannot be changed here");
	}

	await updateCredentialUser(userId, input);
	await db
		.update(tenantMemberships)
		.set({
			permissions: getTenantUserPermissions(input.role),
			role: input.role,
			status: input.status,
			updatedAt: new Date(),
		})
		.where(eq(tenantMemberships.id, membership.id));
}

export async function deleteTenantUser(tenantId: string, userId: string) {
	const [membership] = await db
		.select({ id: tenantMemberships.id, role: tenantMemberships.role })
		.from(tenantMemberships)
		.where(
			and(
				eq(tenantMemberships.tenantId, tenantId),
				eq(tenantMemberships.userId, userId)
			)
		)
		.limit(1);

	if (!membership) {
		throw new Error("User membership was not found for this tenant");
	}

	if (membership.role === "super_admin") {
		throw new Error("Super administrator membership cannot be suspended here");
	}

	await db
		.update(tenantMemberships)
		.set({ status: "suspended", updatedAt: new Date() })
		.where(eq(tenantMemberships.id, membership.id));
}

export async function createHospital(
	tenantId: string,
	input: HospitalMutationInput
) {
	await db.insert(hospitals).values({
		address: toNullableString(input.address),
		code: input.code,
		district: input.district,
		latitude: input.latitude === null ? null : String(input.latitude ?? 0),
		longitude: input.longitude === null ? null : String(input.longitude ?? 0),
		name: input.name,
		primaryContactEmail: toNullableString(input.primaryContactEmail),
		primaryContactName: toNullableString(input.primaryContactName),
		primaryContactPhone: toNullableString(input.primaryContactPhone),
		regionProvince: toNullableString(input.regionProvince),
		tenantId,
	} satisfies HospitalInsert);
}

export async function updateHospital(
	tenantId: string,
	id: string,
	input: HospitalMutationInput
) {
	await getTenantHospitalRecord(tenantId, id);
	await db
		.update(hospitals)
		.set({
			address: toNullableString(input.address),
			code: input.code,
			district: input.district,
			latitude: input.latitude === null ? null : String(input.latitude ?? 0),
			longitude: input.longitude === null ? null : String(input.longitude ?? 0),
			name: input.name,
			primaryContactEmail: toNullableString(input.primaryContactEmail),
			primaryContactName: toNullableString(input.primaryContactName),
			primaryContactPhone: toNullableString(input.primaryContactPhone),
			regionProvince: toNullableString(input.regionProvince),
		})
		.where(and(eq(hospitals.id, id), eq(hospitals.tenantId, tenantId)));
}

export async function deleteHospital(tenantId: string, id: string) {
	await getTenantHospitalRecord(tenantId, id);
	await db
		.update(hospitals)
		.set({ isActive: false })
		.where(and(eq(hospitals.id, id), eq(hospitals.tenantId, tenantId)));
}

export async function createEngineer(
	tenantId: string,
	input: EngineerMutationInput
) {
	await db.insert(engineers).values({
		code: input.code,
		email: toNullableString(input.email),
		grade: input.grade,
		hourlyRateHkd: toMoneyValue(input.hourlyRate),
		mealCapHkd: toMoneyValue(input.mealCap),
		mileageRateHkdPerKm: toMoneyValue(input.mileageRate),
		name: input.name,
		phone: toNullableString(input.phone),
		region: input.region,
		status: input.status,
		tenantId,
	} satisfies EngineerInsert);
}

export async function updateEngineer(
	tenantId: string,
	id: string,
	input: EngineerMutationInput
) {
	await getTenantEngineerRecord(tenantId, id);
	await db
		.update(engineers)
		.set({
			code: input.code,
			email: toNullableString(input.email),
			grade: input.grade,
			hourlyRateHkd: toMoneyValue(input.hourlyRate),
			mealCapHkd: toMoneyValue(input.mealCap),
			mileageRateHkdPerKm: toMoneyValue(input.mileageRate),
			name: input.name,
			phone: toNullableString(input.phone),
			region: input.region,
			status: input.status,
		})
		.where(and(eq(engineers.id, id), eq(engineers.tenantId, tenantId)));
}

export async function deleteEngineer(tenantId: string, id: string) {
	await getTenantEngineerRecord(tenantId, id);
	await db
		.update(engineers)
		.set({ status: "off_duty" })
		.where(and(eq(engineers.id, id), eq(engineers.tenantId, tenantId)));
}

export async function createProduct(
	tenantId: string,
	input: ProductMutationInput
) {
	await ensureTenantPartRecords(tenantId, input.partIds);

	await db.transaction(async (tx) => {
		const [product] = await tx
			.insert(productModels)
			.values({
				category: input.category,
				code: input.code,
				defaultPmCycleMonths: input.defaultPmCycleMonths,
				isEngineerReadOnly: input.isEngineerReadOnly,
				manufacturer: input.manufacturer,
				modelName: input.modelName,
				tenantId,
			} satisfies ProductInsert)
			.returning({ id: productModels.id });

		if (!product) {
			throw new Error("Unable to create product");
		}

		if (input.partIds.length > 0) {
			await tx.insert(productModelParts).values(
				input.partIds.map((partId) => ({
					partId,
					productModelId: product.id,
					tenantId,
				}))
			);
		}

		if (input.serviceManual) {
			await tx.insert(serviceManuals).values({
				fileName: input.serviceManual.fileName,
				fileUrl: input.serviceManual.fileUrl,
				pageCount: input.serviceManual.pageCount ?? null,
				productModelId: product.id,
				status: "uploaded",
				storageKey:
					input.serviceManual.storageKey ??
					`manuals/${tenantId}/${product.id}/${input.serviceManual.fileName}`,
				tenantId,
				version: input.serviceManual.version?.trim() || "1",
			});
		}
	});
}

export async function updateProduct(
	tenantId: string,
	id: string,
	input: ProductMutationInput
) {
	await getTenantProductRecord(tenantId, id);
	await ensureTenantPartRecords(tenantId, input.partIds);

	await db.transaction(async (tx) => {
		await tx
			.update(productModels)
			.set({
				category: input.category,
				code: input.code,
				defaultPmCycleMonths: input.defaultPmCycleMonths,
				isEngineerReadOnly: input.isEngineerReadOnly,
				manufacturer: input.manufacturer,
				modelName: input.modelName,
			})
			.where(
				and(eq(productModels.id, id), eq(productModels.tenantId, tenantId))
			);

		await tx
			.delete(productModelParts)
			.where(
				and(
					eq(productModelParts.productModelId, id),
					eq(productModelParts.tenantId, tenantId)
				)
			);

		if (input.partIds.length > 0) {
			await tx.insert(productModelParts).values(
				input.partIds.map((partId) => ({
					partId,
					productModelId: id,
					tenantId,
				}))
			);
		}

		if (input.serviceManual) {
			const version = input.serviceManual.version?.trim() || "1";

			await tx
				.insert(serviceManuals)
				.values({
					fileName: input.serviceManual.fileName,
					fileUrl: input.serviceManual.fileUrl,
					pageCount: input.serviceManual.pageCount ?? null,
					productModelId: id,
					status: "uploaded",
					storageKey:
						input.serviceManual.storageKey ??
						`manuals/${tenantId}/${id}/${input.serviceManual.fileName}`,
					tenantId,
					version,
				})
				.onConflictDoUpdate({
					set: {
						fileName: input.serviceManual.fileName,
						fileUrl: input.serviceManual.fileUrl,
						pageCount: input.serviceManual.pageCount ?? null,
						status: "uploaded",
						storageKey:
							input.serviceManual.storageKey ??
							`manuals/${tenantId}/${id}/${input.serviceManual.fileName}`,
						uploadedAt: new Date(),
					},
					target: [serviceManuals.productModelId, serviceManuals.version],
				});
		}
	});
}

export async function deleteProduct(tenantId: string, id: string) {
	await getTenantProductRecord(tenantId, id);
	const linkedAssets = await db
		.select({ id: assets.id })
		.from(assets)
		.where(and(eq(assets.productModelId, id), eq(assets.tenantId, tenantId)))
		.limit(1);

	if (linkedAssets.length > 0) {
		throw new Error(
			"This catalogue item is linked to installed assets. Reassign or remove those assets before deleting it."
		);
	}

	await db.transaction(async (tx) => {
		const manualRows = await tx
			.select({ id: serviceManuals.id })
			.from(serviceManuals)
			.where(
				and(
					eq(serviceManuals.productModelId, id),
					eq(serviceManuals.tenantId, tenantId)
				)
			);
		const manualIds = manualRows.map((manual) => manual.id);

		if (manualIds.length > 0) {
			await tx
				.delete(serviceManualSections)
				.where(
					and(
						eq(serviceManualSections.tenantId, tenantId),
						inArray(serviceManualSections.manualId, manualIds)
					)
				);
		}

		await tx
			.delete(serviceManuals)
			.where(
				and(
					eq(serviceManuals.productModelId, id),
					eq(serviceManuals.tenantId, tenantId)
				)
			);
		await tx
			.delete(productModelParts)
			.where(
				and(
					eq(productModelParts.productModelId, id),
					eq(productModelParts.tenantId, tenantId)
				)
			);
		await tx
			.delete(contractModelCoverage)
			.where(
				and(
					eq(contractModelCoverage.productModelId, id),
					eq(contractModelCoverage.tenantId, tenantId)
				)
			);
		await tx
			.delete(productModels)
			.where(
				and(eq(productModels.id, id), eq(productModels.tenantId, tenantId))
			);
	});
}

export async function createPart(tenantId: string, input: PartMutationInput) {
	await ensureTenantProductRecords(tenantId, input.productModelIds);

	await db.transaction(async (tx) => {
		const [part] = await tx
			.insert(parts)
			.values({
				description: input.description,
				name: input.name,
				partNumber: input.partNumber || input.name,
				supplier: input.supplier ?? "",
				tenantId,
				unitCostHkd: toMoneyValue(input.unitCost),
			} satisfies PartInsert)
			.returning({ id: parts.id });

		if (!part) {
			throw new Error("Unable to create part");
		}

		await tx.insert(partInventory).values({
			minimumStock: input.minimumStock,
			partId: part.id,
			stockOnHand: input.stockOnHand,
			tenantId,
		});

		if (input.productModelIds.length > 0) {
			await tx.insert(productModelParts).values(
				input.productModelIds.map((productModelId) => ({
					partId: part.id,
					productModelId,
					tenantId,
				}))
			);
		}
	});
}

export async function updatePart(
	tenantId: string,
	id: string,
	input: PartMutationInput
) {
	await getTenantPartRecord(tenantId, id);
	await ensureTenantProductRecords(tenantId, input.productModelIds);

	await db.transaction(async (tx) => {
		await tx
			.update(parts)
			.set({
				description: input.description,
				name: input.name,
				partNumber: input.partNumber || input.name,
				supplier: input.supplier ?? "",
				unitCostHkd: toMoneyValue(input.unitCost),
			})
			.where(and(eq(parts.id, id), eq(parts.tenantId, tenantId)));

		const [inventory] = await tx
			.select({ id: partInventory.id })
			.from(partInventory)
			.where(
				and(eq(partInventory.partId, id), eq(partInventory.tenantId, tenantId))
			)
			.limit(1);

		if (inventory) {
			await tx
				.update(partInventory)
				.set({
					minimumStock: input.minimumStock,
					stockOnHand: input.stockOnHand,
				})
				.where(eq(partInventory.id, inventory.id));
		} else {
			await tx.insert(partInventory).values({
				minimumStock: input.minimumStock,
				partId: id,
				stockOnHand: input.stockOnHand,
				tenantId,
			});
		}

		await tx
			.delete(productModelParts)
			.where(
				and(
					eq(productModelParts.partId, id),
					eq(productModelParts.tenantId, tenantId)
				)
			);

		if (input.productModelIds.length > 0) {
			await tx.insert(productModelParts).values(
				input.productModelIds.map((productModelId) => ({
					partId: id,
					productModelId,
					tenantId,
				}))
			);
		}
	});
}

export async function deletePart(tenantId: string, id: string) {
	await getTenantPartRecord(tenantId, id);
	await db
		.update(parts)
		.set({ isActive: false })
		.where(and(eq(parts.id, id), eq(parts.tenantId, tenantId)));
}

export async function createAsset(tenantId: string, input: AssetMutationInput) {
	await getTenantProductRecord(tenantId, input.productModelId);
	await getTenantHospitalRecord(tenantId, input.hospitalId);
	await validateOptionalTenantRecord(
		tenantId,
		input.designatedEngineerId,
		getTenantEngineerRecord
	);
	await db.transaction(async (tx) => {
		const [asset] = await tx
			.insert(assets)
			.values({
				assetNumber: input.assetNumber,
				contractCoverageStatus: input.contractCoverageStatus,
				designatedEngineerId: input.designatedEngineerId ?? null,
				hospitalId: input.hospitalId,
				installationDate: toDateValue(input.installationDate),
				locationLabel: input.locationLabel,
				nextPmDueDate: toDateValue(input.nextPmDueDate),
				nfcUid: input.nfcUid,
				productModelId: input.productModelId,
				serialNumber: input.serialNumber,
				tenantId,
				warrantyExpiryDate: toDateValue(input.warrantyExpiryDate),
			} satisfies AssetInsert)
			.returning({ id: assets.id });

		if (!asset) {
			throw new Error("Unable to create asset");
		}

		await tx.insert(nfcTags).values({
			assetId: asset.id,
			commissionedAt: new Date(),
			ndefPayload: { uid: input.nfcUid, v: 1 },
			status: "commissioned",
			tenantId,
			uid: input.nfcUid,
		});
	});
}

export async function updateAsset(
	tenantId: string,
	id: string,
	input: AssetMutationInput
) {
	await getTenantAssetRecord(tenantId, id);
	await getTenantProductRecord(tenantId, input.productModelId);
	await getTenantHospitalRecord(tenantId, input.hospitalId);
	await validateOptionalTenantRecord(
		tenantId,
		input.designatedEngineerId,
		getTenantEngineerRecord
	);
	await db.transaction(async (tx) => {
		await tx
			.update(assets)
			.set({
				assetNumber: input.assetNumber,
				contractCoverageStatus: input.contractCoverageStatus,
				designatedEngineerId: input.designatedEngineerId ?? null,
				hospitalId: input.hospitalId,
				installationDate: toDateValue(input.installationDate),
				locationLabel: input.locationLabel,
				nextPmDueDate: toDateValue(input.nextPmDueDate),
				nfcUid: input.nfcUid,
				productModelId: input.productModelId,
				serialNumber: input.serialNumber,
				warrantyExpiryDate: toDateValue(input.warrantyExpiryDate),
			})
			.where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)));
		await tx
			.update(nfcTags)
			.set({ ndefPayload: { uid: input.nfcUid, v: 1 }, uid: input.nfcUid })
			.where(and(eq(nfcTags.assetId, id), eq(nfcTags.tenantId, tenantId)));
	});
}

export async function deleteAsset(tenantId: string, id: string) {
	await getTenantAssetRecord(tenantId, id);
	await db
		.update(assets)
		.set({ isActive: false })
		.where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)));
}

export async function commissionAssetNfcTag(
	tenantId: string,
	assetId: string,
	input: NfcCommissioningInput
) {
	const asset = await getTenantAssetRecord(tenantId, assetId);
	await validateOptionalTenantRecord(
		tenantId,
		input.engineerId,
		getTenantEngineerRecord
	);

	await db.transaction(async (tx) => {
		await tx
			.update(assets)
			.set({ nfcUid: input.nfcUid })
			.where(and(eq(assets.id, assetId), eq(assets.tenantId, tenantId)));
		await tx
			.update(nfcTags)
			.set({ status: "retired" })
			.where(
				and(
					eq(nfcTags.assetId, assetId),
					eq(nfcTags.tenantId, tenantId),
					ne(nfcTags.status, "retired")
				)
			);
		const [tag] = await tx
			.insert(nfcTags)
			.values({
				assetId,
				commissionedAt: new Date(),
				commissionedByEngineerId: input.engineerId ?? null,
				ndefPayload: { uid: input.nfcUid, v: 1 },
				status: "commissioned",
				tenantId,
				uid: input.nfcUid,
			})
			.returning({ id: nfcTags.id });

		await tx.insert(nfcEvents).values({
			accepted: true,
			assetId,
			engineerId: input.engineerId ?? null,
			eventType: "commissioned",
			expectedUid: input.nfcUid,
			payload: { previousUid: asset.nfcUid, tagId: tag?.id ?? null },
			readUid: input.nfcUid,
			tenantId,
		});
	});

	await createWebsocketEvent({
		entityId: assetId,
		entityType: "asset",
		eventType: "nfc.commissioned",
		payload: { nfcUid: input.nfcUid },
		tenantId,
	});
}

export async function replaceAssetNfcTag(
	tenantId: string,
	assetId: string,
	input: NfcCommissioningInput
) {
	const asset = await getTenantAssetRecord(tenantId, assetId);
	await validateOptionalTenantRecord(
		tenantId,
		input.engineerId,
		getTenantEngineerRecord
	);

	await db.transaction(async (tx) => {
		const [oldTag] = await tx
			.select({ id: nfcTags.id })
			.from(nfcTags)
			.where(
				and(
					eq(nfcTags.assetId, assetId),
					eq(nfcTags.tenantId, tenantId),
					eq(nfcTags.status, "commissioned")
				)
			)
			.orderBy(desc(nfcTags.createdAt))
			.limit(1);
		const [newTag] = await tx
			.insert(nfcTags)
			.values({
				assetId,
				commissionedAt: new Date(),
				commissionedByEngineerId: input.engineerId ?? null,
				ndefPayload: { uid: input.nfcUid, v: 1 },
				status: "commissioned",
				tenantId,
				uid: input.nfcUid,
			})
			.returning({ id: nfcTags.id });

		if (oldTag) {
			await tx
				.update(nfcTags)
				.set({
					replacedByTagId: newTag?.id ?? null,
					status: "replaced",
				})
				.where(eq(nfcTags.id, oldTag.id));
		}

		await tx
			.update(assets)
			.set({ nfcUid: input.nfcUid })
			.where(and(eq(assets.id, assetId), eq(assets.tenantId, tenantId)));
		await tx.insert(nfcEvents).values({
			accepted: true,
			assetId,
			engineerId: input.engineerId ?? null,
			eventType: "replaced",
			expectedUid: input.nfcUid,
			payload: {
				newTagId: newTag?.id ?? null,
				oldTagId: oldTag?.id ?? null,
				previousUid: asset.nfcUid,
			},
			readUid: input.nfcUid,
			tenantId,
		});
	});

	await createWebsocketEvent({
		entityId: assetId,
		entityType: "asset",
		eventType: "nfc.replaced",
		payload: { nfcUid: input.nfcUid },
		tenantId,
	});
}

export async function createJob(
	tenantId: string,
	userId: string,
	input: JobMutationInput
) {
	const asset = await getTenantAssetRecord(tenantId, input.assetId);
	await getTenantHospitalRecord(tenantId, input.hospitalId);
	await validateOptionalTenantRecord(
		tenantId,
		input.assignedEngineerId,
		getTenantEngineerRecord
	);
	await db.transaction(async (tx) => {
		const initialStatus =
			input.assignedEngineerId && input.status === "created"
				? "assigned"
				: input.status;
		const [job] = await tx
			.insert(jobs)
			.values({
				assetId: input.assetId,
				assignedEngineerId: input.assignedEngineerId ?? null,
				createdByUserId: userId,
				description: input.description,
				hospitalId: input.hospitalId || asset.hospitalId,
				jobNumber: input.jobNumber,
				priority: input.priority,
				scheduledStartAt: toTimestampValue(input.scheduledStartAt),
				status: initialStatus,
				tenantId,
				type: input.type,
			} satisfies JobInsert)
			.returning({ id: jobs.id });

		if (!job) {
			throw new Error("Unable to create job");
		}

		await tx.insert(jobStateEvents).values({
			actorUserId: userId,
			eventLabel: `Created with ${titleCase(initialStatus)} status`,
			jobId: job.id,
			tenantId,
			toStatus: initialStatus,
		});

		if (initialStatus === "assigned" && input.assignedEngineerId) {
			await tx.insert(pushNotifications).values({
				body: `${input.jobNumber} is scheduled for ${input.scheduledStartAt ?? "the next service window"}.`,
				engineerId: input.assignedEngineerId,
				jobId: job.id,
				payload: {},
				status: "queued",
				tenantId,
				title: "New job assignment",
				type: "job_assigned",
			});
		}
	});

	await createWebsocketEvent({
		entityId: input.jobNumber,
		entityType: "job",
		eventType: "job.created",
		payload: { status: input.status },
		tenantId,
	});
}

export async function updateJob(
	tenantId: string,
	userId: string,
	id: string,
	input: JobMutationInput
) {
	const existingJob = await getTenantJobRecord(tenantId, id);
	const asset = await getTenantAssetRecord(tenantId, input.assetId);
	await getTenantHospitalRecord(tenantId, input.hospitalId);
	await validateOptionalTenantRecord(
		tenantId,
		input.assignedEngineerId,
		getTenantEngineerRecord
	);
	await db.transaction(async (tx) => {
		const nextStatus = isMutableJobStatus(existingJob.status)
			? input.status
			: existingJob.status;

		if (nextStatus !== existingJob.status) {
			assertJobTransition(existingJob.status, nextStatus);
		}

		await tx
			.update(jobs)
			.set({
				assetId: input.assetId,
				assignedEngineerId: input.assignedEngineerId ?? null,
				description: input.description,
				hospitalId: input.hospitalId || asset.hospitalId,
				jobNumber: input.jobNumber,
				priority: input.priority,
				scheduledStartAt: toTimestampValue(input.scheduledStartAt),
				status: nextStatus,
				type: input.type,
			})
			.where(and(eq(jobs.id, id), eq(jobs.tenantId, tenantId)));

		if (existingJob.status !== nextStatus) {
			await tx.insert(jobStateEvents).values({
				actorUserId: userId,
				eventLabel: `Status changed to ${titleCase(nextStatus)}`,
				fromStatus: existingJob.status,
				jobId: id,
				tenantId,
				toStatus: nextStatus,
			});
		}

		if (
			input.assignedEngineerId &&
			existingJob.assignedEngineerId !== input.assignedEngineerId
		) {
			await tx.insert(pushNotifications).values({
				body: `${input.jobNumber} was assigned to you by Back Office.`,
				engineerId: input.assignedEngineerId,
				jobId: id,
				payload: {},
				status: "queued",
				tenantId,
				title: "Job assignment updated",
				type: "job_assigned",
			});
		}
	});

	await createWebsocketEvent({
		entityId: id,
		entityType: "job",
		eventType: "job.updated",
		payload: { status: input.status },
		tenantId,
	});
}

export async function deleteJob(tenantId: string, id: string) {
	await getTenantJobRecord(tenantId, id);
	await db.transaction(async (tx) => {
		await tx
			.delete(jobCosts)
			.where(and(eq(jobCosts.jobId, id), eq(jobCosts.tenantId, tenantId)));
		await tx
			.delete(jobExpenses)
			.where(
				and(eq(jobExpenses.jobId, id), eq(jobExpenses.tenantId, tenantId))
			);
		await tx
			.delete(jobPartsUsage)
			.where(
				and(eq(jobPartsUsage.jobId, id), eq(jobPartsUsage.tenantId, tenantId))
			);
		await tx
			.delete(partsShortages)
			.where(
				and(eq(partsShortages.jobId, id), eq(partsShortages.tenantId, tenantId))
			);
		await tx
			.delete(jobTimers)
			.where(and(eq(jobTimers.jobId, id), eq(jobTimers.tenantId, tenantId)));
		await tx
			.delete(geofenceEvents)
			.where(
				and(eq(geofenceEvents.jobId, id), eq(geofenceEvents.tenantId, tenantId))
			);
		await tx
			.delete(nfcEvents)
			.where(and(eq(nfcEvents.jobId, id), eq(nfcEvents.tenantId, tenantId)));
		await tx
			.delete(jobStateEvents)
			.where(
				and(eq(jobStateEvents.jobId, id), eq(jobStateEvents.tenantId, tenantId))
			);
		await tx
			.delete(jobs)
			.where(and(eq(jobs.id, id), eq(jobs.tenantId, tenantId)));
	});
}

export async function createContract(
	tenantId: string,
	input: ContractMutationInput
) {
	await getTenantHospitalRecord(tenantId, input.hospitalId);
	for (const productModelId of input.coveredModelIds) {
		await getTenantProductRecord(tenantId, productModelId);
	}
	for (const partId of input.coveredPartIds) {
		await getTenantPartRecord(tenantId, partId);
	}

	await db.transaction(async (tx) => {
		const [contract] = await tx
			.insert(contracts)
			.values({
				accountManagerName: input.accountManagerName,
				contractNumber: input.contractNumber,
				endDate: input.endDate,
				hospitalId: input.hospitalId,
				responseSlaHours: input.responseSlaHours,
				startDate: input.startDate,
				status: input.status,
				tenantId,
				type: input.type,
			} satisfies ContractInsert)
			.returning({ id: contracts.id });

		if (!contract) {
			throw new Error("Unable to create contract");
		}

		if (input.coveredModelIds.length > 0) {
			await tx.insert(contractModelCoverage).values(
				input.coveredModelIds.map((productModelId) => ({
					contractId: contract.id,
					coverageStatus: "in_contract" as const,
					productModelId,
					tenantId,
				}))
			);
		}
		if (input.coveredPartIds.length > 0) {
			await tx.insert(contractPartCoverage).values(
				input.coveredPartIds.map((partId) => ({
					contractId: contract.id,
					coverageStatus: "in_contract" as const,
					partId,
					tenantId,
				}))
			);
		}
	});
}

export async function updateContract(
	tenantId: string,
	id: string,
	input: ContractMutationInput
) {
	await getTenantContractRecord(tenantId, id);
	await getTenantHospitalRecord(tenantId, input.hospitalId);
	for (const productModelId of input.coveredModelIds) {
		await getTenantProductRecord(tenantId, productModelId);
	}
	for (const partId of input.coveredPartIds) {
		await getTenantPartRecord(tenantId, partId);
	}

	await db.transaction(async (tx) => {
		await tx
			.update(contracts)
			.set({
				accountManagerName: input.accountManagerName,
				contractNumber: input.contractNumber,
				endDate: input.endDate,
				hospitalId: input.hospitalId,
				responseSlaHours: input.responseSlaHours,
				startDate: input.startDate,
				status: input.status,
				type: input.type,
			})
			.where(and(eq(contracts.id, id), eq(contracts.tenantId, tenantId)));
		await tx
			.delete(contractModelCoverage)
			.where(
				and(
					eq(contractModelCoverage.contractId, id),
					eq(contractModelCoverage.tenantId, tenantId)
				)
			);
		await tx
			.delete(contractPartCoverage)
			.where(
				and(
					eq(contractPartCoverage.contractId, id),
					eq(contractPartCoverage.tenantId, tenantId)
				)
			);
		if (input.coveredModelIds.length > 0) {
			await tx.insert(contractModelCoverage).values(
				input.coveredModelIds.map((productModelId) => ({
					contractId: id,
					coverageStatus: "in_contract" as const,
					productModelId,
					tenantId,
				}))
			);
		}
		if (input.coveredPartIds.length > 0) {
			await tx.insert(contractPartCoverage).values(
				input.coveredPartIds.map((partId) => ({
					contractId: id,
					coverageStatus: "in_contract" as const,
					partId,
					tenantId,
				}))
			);
		}
	});
}

export async function deleteContract(tenantId: string, id: string) {
	await getTenantContractRecord(tenantId, id);
	await db.transaction(async (tx) => {
		await tx
			.delete(contractModelCoverage)
			.where(
				and(
					eq(contractModelCoverage.contractId, id),
					eq(contractModelCoverage.tenantId, tenantId)
				)
			);
		await tx
			.delete(contractPartCoverage)
			.where(
				and(
					eq(contractPartCoverage.contractId, id),
					eq(contractPartCoverage.tenantId, tenantId)
				)
			);
		await tx
			.delete(contracts)
			.where(and(eq(contracts.id, id), eq(contracts.tenantId, tenantId)));
	});
}

export async function createFault(tenantId: string, input: FaultMutationInput) {
	await getTenantHospitalRecord(tenantId, input.hospitalId);
	await validateOptionalTenantRecord(
		tenantId,
		input.assetId,
		getTenantAssetRecord
	);
	await db.insert(faultReports).values({
		assetId: input.assetId ?? null,
		description: input.description,
		hospitalId: input.hospitalId,
		reportNumber: input.reportNumber,
		severity: input.severity,
		source: "back_office",
		status: input.status,
		submittedByContact: toNullableString(input.submittedByContact),
		submittedByName: input.submittedByName,
		tenantId,
	} satisfies FaultReportInsert);
}

export async function updateFault(
	tenantId: string,
	id: string,
	input: FaultMutationInput
) {
	await getTenantFaultRecord(tenantId, id);
	await getTenantHospitalRecord(tenantId, input.hospitalId);
	await validateOptionalTenantRecord(
		tenantId,
		input.assetId,
		getTenantAssetRecord
	);
	await db
		.update(faultReports)
		.set({
			assetId: input.assetId ?? null,
			description: input.description,
			hospitalId: input.hospitalId,
			reportNumber: input.reportNumber,
			severity: input.severity,
			status: input.status,
			submittedByContact: toNullableString(input.submittedByContact),
			submittedByName: input.submittedByName,
		})
		.where(and(eq(faultReports.id, id), eq(faultReports.tenantId, tenantId)));
}

export async function deleteFault(tenantId: string, id: string) {
	await getTenantFaultRecord(tenantId, id);
	await db
		.delete(faultReports)
		.where(and(eq(faultReports.id, id), eq(faultReports.tenantId, tenantId)));
}

export async function transitionJob(
	tenantId: string,
	userId: string,
	id: string,
	input: JobTransitionInput
) {
	const existingJob = await getTenantJobRecord(tenantId, id);
	assertJobTransition(existingJob.status, input.status);

	await db.transaction(async (tx) => {
		await tx
			.update(jobs)
			.set({
				actualCompletedAt:
					input.status === "completed"
						? new Date()
						: existingJob.actualCompletedAt,
				status: input.status,
			})
			.where(and(eq(jobs.id, id), eq(jobs.tenantId, tenantId)));
		await tx.insert(jobStateEvents).values({
			actorUserId: userId,
			eventLabel: input.notes || `Status changed to ${titleCase(input.status)}`,
			fromStatus: existingJob.status,
			jobId: id,
			notes: toNullableString(input.notes),
			tenantId,
			toStatus: input.status,
		});
	});

	await queueNotification({
		body: `${existingJob.jobNumber} is now ${titleCase(input.status)}.`,
		engineerId: existingJob.assignedEngineerId,
		jobId: id,
		tenantId,
		title: "Job status changed",
		type: "status_changed",
	});
	await createWebsocketEvent({
		entityId: id,
		entityType: "job",
		eventType: "job.status_changed",
		payload: { fromStatus: existingJob.status, toStatus: input.status },
		tenantId,
	});

	if (input.status === "completed") {
		await completeJobSideEffects(tenantId, id);
	}
}

const completeJobSideEffects = async (tenantId: string, jobId: string) => {
	const job = await getTenantJobRecord(tenantId, jobId);
	const asset = await getTenantAssetRecord(tenantId, job.assetId);
	const product = await getTenantProductRecord(tenantId, asset.productModelId);
	const completedAt = job.actualCompletedAt ?? new Date();

	if (job.type === "preventive_maintenance" || job.type === "installation") {
		await db
			.update(assets)
			.set({
				installationDate:
					job.type === "installation"
						? formatDateOnly(
								asset.installationDate
									? new Date(asset.installationDate)
									: completedAt
							)
						: asset.installationDate,
				nextPmDueDate: formatDateOnly(
					addMonths(completedAt, product.defaultPmCycleMonths)
				),
			})
			.where(and(eq(assets.id, job.assetId), eq(assets.tenantId, tenantId)));
	}

	await recalculateJobCost(tenantId, jobId);
};

export async function startJobWithNfc(
	tenantId: string,
	id: string,
	input: NfcJobInput
) {
	const job = await getTenantJobRecord(tenantId, id);
	const asset = await getTenantAssetRecord(tenantId, job.assetId);
	const engineerId = job.assignedEngineerId;
	const isUidAccepted = input.nfcUid === asset.nfcUid;

	if (!engineerId) {
		throw new Error("Assign an engineer before starting a job");
	}

	if (!isUidAccepted) {
		await db.insert(nfcEvents).values({
			accepted: false,
			assetId: asset.id,
			eventType: "rejected",
			expectedUid: asset.nfcUid,
			jobId: id,
			readUid: input.nfcUid,
			rejectionReason: "NFC uid did not match the assigned asset",
			tenantId,
		});
		throw new Error("NFC uid did not match the assigned asset");
	}

	assertJobTransition(job.status, "in_progress");
	const radiusMeters = await getNumericSystemParameter(
		tenantId,
		"geofence_radius_meters",
		200
	);

	await db.transaction(async (tx) => {
		const [event] = await tx
			.insert(nfcEvents)
			.values({
				accepted: true,
				assetId: asset.id,
				engineerId,
				eventType: "job_start",
				expectedUid: asset.nfcUid,
				jobId: id,
				readUid: input.nfcUid,
				tenantId,
			})
			.returning({ id: nfcEvents.id });
		const startedAt = new Date();

		await tx.insert(jobTimers).values({
			engineerId,
			jobId: id,
			startNfcEventId: event?.id,
			startedAt,
			tenantId,
		});
		await tx
			.update(jobs)
			.set({
				actualStartedAt: job.actualStartedAt ?? startedAt,
				status: "in_progress",
			})
			.where(and(eq(jobs.id, id), eq(jobs.tenantId, tenantId)));
		await tx
			.update(engineers)
			.set({ status: "on_site" })
			.where(eq(engineers.id, engineerId));
		await tx.insert(jobStateEvents).values({
			actorEngineerId: engineerId,
			eventLabel:
				input.notes || "NFC start accepted, timer and geofence started",
			fromStatus: job.status,
			jobId: id,
			notes: toNullableString(input.notes),
			tenantId,
			toStatus: "in_progress",
		});
		await tx.insert(geofenceEvents).values({
			engineerId,
			eventType: "activated",
			hospitalId: job.hospitalId,
			jobId: id,
			latitude: toNullableCoordinate(input.latitude),
			longitude: toNullableCoordinate(input.longitude),
			radiusMeters,
			tenantId,
		});

		if (
			typeof input.latitude === "number" &&
			typeof input.longitude === "number"
		) {
			await tx.insert(engineerLocations).values({
				accuracyMeters:
					input.accuracyMeters === null
						? null
						: String(input.accuracyMeters ?? 0),
				engineerId,
				jobId: id,
				latitude: String(input.latitude ?? 0),
				longitude: String(input.longitude ?? 0),
				tenantId,
			});
		}
	});

	await createWebsocketEvent({
		entityId: id,
		entityType: "job",
		eventType: "job.started",
		tenantId,
	});
	await detectOpportunisticPm(tenantId, engineerId, job.hospitalId, id);
}

export async function endJobWithNfc(
	tenantId: string,
	id: string,
	input: NfcJobInput
) {
	const job = await getTenantJobRecord(tenantId, id);
	const asset = await getTenantAssetRecord(tenantId, job.assetId);
	const engineerId = job.assignedEngineerId;

	if (!engineerId) {
		throw new Error("Job does not have an assigned engineer");
	}

	if (input.nfcUid !== asset.nfcUid) {
		await db.insert(nfcEvents).values({
			accepted: false,
			assetId: asset.id,
			engineerId,
			eventType: "rejected",
			expectedUid: asset.nfcUid,
			jobId: id,
			readUid: input.nfcUid,
			rejectionReason: "NFC uid did not match the assigned asset",
			tenantId,
		});
		throw new Error("NFC uid did not match the assigned asset");
	}

	assertJobTransition(job.status, "completed");
	const [activeTimer] = await db
		.select({ id: jobTimers.id, startedAt: jobTimers.startedAt })
		.from(jobTimers)
		.where(
			and(
				eq(jobTimers.jobId, id),
				eq(jobTimers.tenantId, tenantId),
				isNull(jobTimers.endedAt)
			)
		)
		.orderBy(desc(jobTimers.startedAt))
		.limit(1);
	const endedAt = new Date();
	const durationMinutes = activeTimer
		? Math.max(
				1,
				Math.round(
					(endedAt.getTime() - activeTimer.startedAt.getTime()) /
						millisecondsPerMinute
				)
			)
		: 0;

	await db.transaction(async (tx) => {
		const [event] = await tx
			.insert(nfcEvents)
			.values({
				accepted: true,
				assetId: asset.id,
				engineerId,
				eventType: "job_end",
				expectedUid: asset.nfcUid,
				jobId: id,
				readUid: input.nfcUid,
				tenantId,
			})
			.returning({ id: nfcEvents.id });

		if (activeTimer) {
			await tx
				.update(jobTimers)
				.set({
					durationMinutes,
					endNfcEventId: event?.id,
					endedAt,
				})
				.where(eq(jobTimers.id, activeTimer.id));
		}

		await tx
			.update(jobs)
			.set({ actualCompletedAt: endedAt, status: "completed" })
			.where(and(eq(jobs.id, id), eq(jobs.tenantId, tenantId)));
		await tx
			.update(engineers)
			.set({ status: "idle" })
			.where(eq(engineers.id, engineerId));
		await tx.insert(jobStateEvents).values({
			actorEngineerId: engineerId,
			eventLabel: input.notes || "NFC end accepted, service record completed",
			fromStatus: job.status,
			jobId: id,
			notes: toNullableString(input.notes),
			tenantId,
			toStatus: "completed",
		});
		await tx.insert(geofenceEvents).values({
			engineerId,
			eventType: "resolved",
			hospitalId: job.hospitalId,
			jobId: id,
			latitude: toNullableCoordinate(input.latitude),
			longitude: toNullableCoordinate(input.longitude),
			tenantId,
		});
	});

	await completeJobSideEffects(tenantId, id);
	await createWebsocketEvent({
		entityId: id,
		entityType: "job",
		eventType: "job.completed",
		tenantId,
	});
}

const detectOpportunisticPm = async (
	tenantId: string,
	engineerId: string,
	hospitalId: string,
	sourceJobId: string
) => {
	const advanceWindowDays = await getNumericSystemParameter(
		tenantId,
		"pm_advance_window_days",
		2
	);
	const dueBefore = new Date();
	dueBefore.setDate(dueBefore.getDate() + advanceWindowDays);
	const dueBeforeDate = formatDateOnly(dueBefore);
	const dueAssets = await db
		.select({
			id: assets.id,
			nextPmDueDate: assets.nextPmDueDate,
		})
		.from(assets)
		.where(
			and(
				eq(assets.tenantId, tenantId),
				eq(assets.hospitalId, hospitalId),
				eq(assets.isActive, true),
				lte(assets.nextPmDueDate, dueBeforeDate)
			)
		);

	for (const asset of dueAssets) {
		if (!asset.nextPmDueDate) {
			continue;
		}

		await db
			.insert(opportunisticPmAlerts)
			.values({
				assetId: asset.id,
				daysUntilDue: advanceWindowDays,
				engineerId,
				pmDueDate: asset.nextPmDueDate,
				sourceJobId,
				status: "open",
				tenantId,
			})
			.onConflictDoNothing();
	}

	if (dueAssets.length > 0) {
		await createWebsocketEvent({
			entityId: sourceJobId,
			entityType: "pm_alert",
			eventType: "pm.opportunity_detected",
			payload: { count: dueAssets.length },
			tenantId,
		});
	}
};

const detectGeofenceTimerAnomaly = async (
	tenantId: string,
	engineerId: string,
	input: {
		latitude: number;
		longitude: number;
	}
) => {
	const [activeJob] = await db
		.select({
			hospitalId: jobs.hospitalId,
			hospitalLatitude: hospitals.latitude,
			hospitalLongitude: hospitals.longitude,
			id: jobs.id,
			status: jobs.status,
		})
		.from(jobs)
		.innerJoin(hospitals, eq(hospitals.id, jobs.hospitalId))
		.where(
			and(
				eq(jobs.tenantId, tenantId),
				eq(jobs.assignedEngineerId, engineerId),
				inArray(jobs.status, ["in_progress", "resumed", "timer_anomaly"])
			)
		)
		.orderBy(desc(jobs.actualStartedAt))
		.limit(1);

	if (!(activeJob?.hospitalLatitude && activeJob.hospitalLongitude)) {
		return;
	}

	const radiusMeters = await getNumericSystemParameter(
		tenantId,
		"geofence_radius_meters",
		200
	);
	const countdownMinutes = await getNumericSystemParameter(
		tenantId,
		"geofence_alert_countdown_minutes",
		5
	);
	const distanceMeters = distanceMetersBetween(
		{
			latitude: numberFrom(activeJob.hospitalLatitude),
			longitude: numberFrom(activeJob.hospitalLongitude),
		},
		input
	);
	const isOutsideGeofence = distanceMeters > radiusMeters;
	const eventType = isOutsideGeofence ? "exited" : "entered";

	await db.insert(geofenceEvents).values({
		distanceMeters: String(distanceMeters),
		engineerId,
		eventType,
		hospitalId: activeJob.hospitalId,
		jobId: activeJob.id,
		latitude: String(input.latitude),
		longitude: String(input.longitude),
		radiusMeters,
		tenantId,
	});

	if (!isOutsideGeofence || activeJob.status === "timer_anomaly") {
		return;
	}

	const anomalyThreshold = new Date(
		Date.now() - countdownMinutes * millisecondsPerMinute
	);
	const [firstExit] = await db
		.select({ createdAt: geofenceEvents.createdAt })
		.from(geofenceEvents)
		.where(
			and(
				eq(geofenceEvents.tenantId, tenantId),
				eq(geofenceEvents.jobId, activeJob.id),
				eq(geofenceEvents.eventType, "exited")
			)
		)
		.orderBy(asc(geofenceEvents.createdAt))
		.limit(1);

	if (!firstExit || firstExit.createdAt > anomalyThreshold) {
		return;
	}

	await reportTimerAnomaly(tenantId, activeJob.id, {
		latitude: input.latitude,
		longitude: input.longitude,
		nfcUid: "",
		notes: `Outside ${radiusMeters}m geofence for ${countdownMinutes} minutes`,
	});
};

export async function reportTimerAnomaly(
	tenantId: string,
	id: string,
	input: NfcJobInput
) {
	const job = await getTenantJobRecord(tenantId, id);
	const engineerId = job.assignedEngineerId;

	if (!engineerId) {
		throw new Error("Job does not have an assigned engineer");
	}

	await db.transaction(async (tx) => {
		await tx
			.update(jobs)
			.set({ status: "timer_anomaly" })
			.where(and(eq(jobs.id, id), eq(jobs.tenantId, tenantId)));
		await tx
			.update(engineers)
			.set({ status: "timer_anomaly" })
			.where(eq(engineers.id, engineerId));
		await tx.insert(geofenceEvents).values({
			distanceMeters: null,
			engineerId,
			eventType: "timer_anomaly",
			hospitalId: job.hospitalId,
			jobId: id,
			latitude: toNullableCoordinate(input.latitude),
			longitude: toNullableCoordinate(input.longitude),
			tenantId,
		});
		await tx.insert(jobStateEvents).values({
			actorEngineerId: engineerId,
			eventLabel:
				input.notes || "Engineer outside geofence while timer is running",
			fromStatus: job.status,
			jobId: id,
			notes: toNullableString(input.notes),
			tenantId,
			toStatus: "timer_anomaly",
		});
	});

	await queueNotification({
		body: `${job.jobNumber} has a timer anomaly. Confirm on-site or close the job.`,
		engineerId,
		jobId: id,
		tenantId,
		title: "Timer anomaly",
		type: "geofence_alert",
	});
	await createWebsocketEvent({
		entityId: id,
		entityType: "job",
		eventType: "job.timer_anomaly",
		tenantId,
	});
}

export async function logJobExpense(
	tenantId: string,
	jobId: string,
	input: ExpenseMutationInput
) {
	const job = await getTenantJobRecord(tenantId, jobId);

	if (!job.assignedEngineerId) {
		throw new Error("Assign an engineer before logging expenses");
	}

	const assignedEngineerId = job.assignedEngineerId;
	const engineer = await getTenantEngineerRecord(tenantId, assignedEngineerId);
	let amount = input.amount ?? 0;

	if (input.type === "mileage") {
		amount = (input.quantity ?? 0) * numberFrom(engineer.mileageRateHkdPerKm);
	}

	if (input.type === "meal") {
		amount = Math.min(input.amount ?? 0, numberFrom(engineer.mealCapHkd));
	}

	await db.transaction(async (tx) => {
		let receiptAttachmentId: string | null = null;

		if (input.receiptFileName) {
			const [attachment] = await tx
				.insert(fileAttachments)
				.values({
					fileName: input.receiptFileName,
					fileUrl: `receipt://${input.receiptFileName}`,
					mimeType: "image/*",
					ownerId: jobId,
					ownerType: "job_expense",
					storageKey: `receipts/${tenantId}/${jobId}/${input.receiptFileName}`,
					tenantId,
				})
				.returning({ id: fileAttachments.id });
			receiptAttachmentId = attachment?.id ?? null;
		}

		await tx.insert(jobExpenses).values({
			amountHkd: toMoneyValue(amount),
			engineerId: assignedEngineerId,
			jobId,
			notes: toNullableString(input.notes),
			quantity:
				input.quantity === null || input.quantity === undefined
					? undefined
					: String(input.quantity),
			receiptAttachmentId: receiptAttachmentId ?? undefined,
			tenantId,
			type: input.type,
		});
	});

	await recalculateJobCost(tenantId, jobId);
}

export async function addJobPartUsage(
	tenantId: string,
	jobId: string,
	input: PartUsageMutationInput
) {
	const job = await getTenantJobRecord(tenantId, jobId);
	const part = await getTenantPartRecord(tenantId, input.partId);
	const coverageStatus = await getPartCoverageStatus(
		db,
		tenantId,
		job.hospitalId,
		input.partId
	);
	const isBillable = coverageStatus !== "in_contract";

	await db.insert(jobPartsUsage).values({
		coverageStatus,
		isBillable,
		jobId,
		partId: input.partId,
		quantity: input.quantity,
		tenantId,
		unitCostHkd: part.unitCostHkd,
	});
	await recalculateJobCost(tenantId, jobId);
	await createWebsocketEvent({
		entityId: jobId,
		entityType: "job_part",
		eventType: "parts.used",
		payload: { isBillable, partId: input.partId, quantity: input.quantity },
		tenantId,
	});
}

export async function reportPartsShortage(
	tenantId: string,
	jobId: string,
	input: ShortageMutationInput
) {
	const job = await getTenantJobRecord(tenantId, jobId);
	await getTenantPartRecord(tenantId, input.partId);

	if (!job.assignedEngineerId) {
		throw new Error("Assign an engineer before reporting a shortage");
	}

	assertJobTransition(job.status, "paused");
	const shortageNumber = `SH-${Date.now().toString().slice(-6)}`;

	await db.transaction(async (tx) => {
		await tx.insert(partsShortages).values({
			engineerId: job.assignedEngineerId,
			jobId,
			notes: toNullableString(input.notes),
			partId: input.partId,
			quantityRequested: input.quantityRequested,
			shortageNumber,
			status: "waiting_for_parts",
			tenantId,
		});
		await tx
			.update(jobs)
			.set({ status: "paused" })
			.where(and(eq(jobs.id, jobId), eq(jobs.tenantId, tenantId)));
		await tx.insert(jobStateEvents).values({
			actorEngineerId: job.assignedEngineerId,
			eventLabel: input.notes || "Job paused for parts shortage",
			fromStatus: job.status,
			jobId,
			notes: toNullableString(input.notes),
			tenantId,
			toStatus: "paused",
		});
	});

	await createWebsocketEvent({
		entityId: jobId,
		entityType: "shortage",
		eventType: "shortage.reported",
		payload: { partId: input.partId, shortageNumber },
		tenantId,
	});
}

export async function confirmPartsArrived(
	tenantId: string,
	userId: string,
	shortageId: string
) {
	const [shortage] = await db
		.select({
			engineerId: partsShortages.engineerId,
			id: partsShortages.id,
			jobId: partsShortages.jobId,
			shortageNumber: partsShortages.shortageNumber,
		})
		.from(partsShortages)
		.where(
			and(
				eq(partsShortages.id, shortageId),
				eq(partsShortages.tenantId, tenantId)
			)
		)
		.limit(1);

	if (!shortage) {
		throw new Error("Shortage record was not found for this tenant");
	}

	await db
		.update(partsShortages)
		.set({
			arrivedAt: new Date(),
			confirmedByUserId: userId,
			status: "arrived",
		})
		.where(eq(partsShortages.id, shortageId));
	await queueNotification({
		body: `${shortage.shortageNumber} parts have arrived.`,
		engineerId: shortage.engineerId,
		jobId: shortage.jobId,
		tenantId,
		title: "Parts arrived",
		type: "parts_arrived",
	});
	await createWebsocketEvent({
		entityId: shortageId,
		entityType: "shortage",
		eventType: "shortage.arrived",
		tenantId,
	});
}

export async function resumeShortageJob(
	tenantId: string,
	userId: string,
	shortageId: string,
	input: ResumeShortageInput
) {
	const [shortage] = await db
		.select({
			engineerId: partsShortages.engineerId,
			id: partsShortages.id,
			jobId: partsShortages.jobId,
		})
		.from(partsShortages)
		.where(
			and(
				eq(partsShortages.id, shortageId),
				eq(partsShortages.tenantId, tenantId)
			)
		)
		.limit(1);

	if (!shortage) {
		throw new Error("Shortage record was not found for this tenant");
	}

	const job = await getTenantJobRecord(tenantId, shortage.jobId);
	assertJobTransition(job.status, "resumed");

	await db.transaction(async (tx) => {
		await tx
			.update(partsShortages)
			.set({ status: "reschedule_ready" })
			.where(eq(partsShortages.id, shortageId));
		await tx
			.update(jobs)
			.set({
				scheduledStartAt: toTimestampValue(input.scheduledStartAt),
				status: "resumed",
			})
			.where(and(eq(jobs.id, shortage.jobId), eq(jobs.tenantId, tenantId)));
		await tx.insert(jobStateEvents).values({
			actorUserId: userId,
			eventLabel: "Parts arrived and job resumed",
			fromStatus: job.status,
			jobId: shortage.jobId,
			tenantId,
			toStatus: "resumed",
		});
	});
	await queueNotification({
		body: `${job.jobNumber} is ready to resume.`,
		engineerId: shortage.engineerId,
		jobId: shortage.jobId,
		tenantId,
		title: "Job resumed",
		type: "job_resumed",
	});
	await createWebsocketEvent({
		entityId: shortage.jobId,
		entityType: "job",
		eventType: "job.resumed",
		tenantId,
	});
}

export async function updateSystemParameter(
	tenantId: string,
	userId: string,
	input: SystemParameterMutationInput
) {
	await getTenantRecord(tenantId);
	await db
		.insert(systemParameters)
		.values({
			description: parameterLabel(input.key),
			key: input.key,
			tenantId,
			updatedByUserId: userId,
			value: input.value,
			valueType: input.valueType,
		})
		.onConflictDoUpdate({
			set: {
				updatedAt: new Date(),
				updatedByUserId: userId,
				value: input.value,
				valueType: input.valueType,
			},
			target: [systemParameters.tenantId, systemParameters.key],
		});
	await createWebsocketEvent({
		entityId: input.key,
		entityType: "system_parameter",
		eventType: "system_parameter.updated",
		tenantId,
	});
}

export async function updateProductParts(
	tenantId: string,
	productModelId: string,
	input: ProductPartsMutationInput
) {
	await getTenantProductRecord(tenantId, productModelId);
	for (const partId of input.partIds) {
		await getTenantPartRecord(tenantId, partId);
	}

	await db.transaction(async (tx) => {
		await tx
			.delete(productModelParts)
			.where(
				and(
					eq(productModelParts.productModelId, productModelId),
					eq(productModelParts.tenantId, tenantId)
				)
			);

		if (input.partIds.length > 0) {
			await tx.insert(productModelParts).values(
				input.partIds.map((partId) => ({
					partId,
					productModelId,
					tenantId,
				}))
			);
		}
	});
}

export async function uploadServiceManualMetadata(
	tenantId: string,
	userId: string,
	productModelId: string,
	input: ServiceManualMutationInput
) {
	await getTenantProductRecord(tenantId, productModelId);
	const version = input.version?.trim() || "1";

	await db
		.insert(serviceManuals)
		.values({
			fileName: input.fileName,
			fileUrl: input.fileUrl,
			pageCount: input.pageCount ?? null,
			productModelId,
			status: "uploaded",
			storageKey:
				input.storageKey ??
				`manuals/${tenantId}/${productModelId}/${input.fileName}`,
			tenantId,
			uploadedByUserId: userId,
			version,
		})
		.onConflictDoUpdate({
			set: {
				fileName: input.fileName,
				fileUrl: input.fileUrl,
				pageCount: input.pageCount ?? null,
				status: "uploaded",
				storageKey:
					input.storageKey ??
					`manuals/${tenantId}/${productModelId}/${input.fileName}`,
				uploadedAt: new Date(),
				uploadedByUserId: userId,
			},
			target: [serviceManuals.productModelId, serviceManuals.version],
		});
	await createWebsocketEvent({
		entityId: productModelId,
		entityType: "service_manual",
		eventType: "manual.uploaded",
		tenantId,
	});
}

export async function refreshContractStatuses(tenantId: string) {
	const warningDays = await getNumericSystemParameter(
		tenantId,
		"contract_expiry_warning_days",
		30
	);
	const today = new Date();
	const warningDate = new Date();
	warningDate.setDate(warningDate.getDate() + warningDays);
	const todayValue = formatDateOnly(today);
	const warningValue = formatDateOnly(warningDate);
	const contractRows = await db
		.select({ endDate: contracts.endDate, id: contracts.id })
		.from(contracts)
		.where(eq(contracts.tenantId, tenantId));

	for (const contract of contractRows) {
		let nextStatus: ContractRow["status"] = "active";

		if (contract.endDate < todayValue) {
			nextStatus = "expired";
		} else if (contract.endDate <= warningValue) {
			nextStatus = "expiring";
		}

		await db
			.update(contracts)
			.set({ status: nextStatus })
			.where(
				and(eq(contracts.id, contract.id), eq(contracts.tenantId, tenantId))
			);
	}

	await createWebsocketEvent({
		entityId: tenantId,
		entityType: "contract",
		eventType: "contract.statuses_refreshed",
		tenantId,
	});
}

export async function generateOperationalReportSnapshot(
	tenantId: string,
	period: typeof reportSnapshots.$inferInsert.period
) {
	const now = new Date();
	const periodStart = new Date(now);

	if (period === "week") {
		periodStart.setDate(now.getDate() - 7);
	} else if (period === "month") {
		periodStart.setMonth(now.getMonth() - 1);
	}

	const metrics = await getJobReportMetrics(tenantId);

	await db
		.insert(reportSnapshots)
		.values({
			metrics,
			period,
			periodEnd: formatDateOnly(now),
			periodStart: formatDateOnly(periodStart),
			tenantId,
		})
		.onConflictDoUpdate({
			set: { createdAt: new Date(), metrics },
			target: [
				reportSnapshots.tenantId,
				reportSnapshots.period,
				reportSnapshots.periodStart,
				reportSnapshots.periodEnd,
			],
		});
	await createWebsocketEvent({
		entityId: tenantId,
		entityType: "report",
		eventType: "report.generated",
		payload: { period },
		tenantId,
	});
}

export async function convertFaultToRepairJob(
	tenantId: string,
	userId: string,
	faultId: string
) {
	const fault = await getTenantFaultRecord(tenantId, faultId);

	if (!fault.assetId) {
		throw new Error(
			"Select an asset before converting a fault report to a job"
		);
	}

	const asset = await getTenantAssetRecord(tenantId, fault.assetId);
	const jobNumber = `J-FLT-${fault.reportNumber.replace(/\D/g, "") || Date.now()}`;
	let jobId = "";

	await db.transaction(async (tx) => {
		const [job] = await tx
			.insert(jobs)
			.values({
				assetId: fault.assetId ?? asset.id,
				createdByUserId: userId,
				description: fault.description,
				hospitalId: fault.hospitalId,
				jobNumber,
				priority:
					fault.severity === "critical" || fault.severity === "high"
						? "urgent"
						: "normal",
				status: asset.designatedEngineerId ? "assigned" : "created",
				tenantId,
				type: "repair",
				assignedEngineerId: asset.designatedEngineerId,
			})
			.returning({ id: jobs.id });

		if (!job) {
			throw new Error("Unable to convert fault report");
		}

		jobId = job.id;
		await tx
			.update(faultReports)
			.set({
				convertedJobId: job.id,
				status: asset.designatedEngineerId ? "engineer_assigned" : "received",
			})
			.where(
				and(eq(faultReports.id, faultId), eq(faultReports.tenantId, tenantId))
			);
		await tx.insert(jobStateEvents).values({
			actorUserId: userId,
			eventLabel: `Created from fault ${fault.reportNumber}`,
			jobId: job.id,
			tenantId,
			toStatus: asset.designatedEngineerId ? "assigned" : "created",
		});
	});

	await createWebsocketEvent({
		entityId: jobId,
		entityType: "job",
		eventType: "fault.converted",
		payload: { faultId },
		tenantId,
	});
}

export async function approvePmOpportunity(
	tenantId: string,
	userId: string,
	alertId: string,
	input: ApprovePmOpportunityInput
) {
	const alert = await getTenantPmAlertRecord(tenantId, alertId);
	const asset = await getTenantAssetRecord(tenantId, alert.assetId);
	const engineer = await getTenantEngineerRecord(tenantId, alert.engineerId);
	const jobNumber = `J-PM-${Date.now().toString().slice(-6)}`;
	let jobId = "";

	await db.transaction(async (tx) => {
		const [job] = await tx
			.insert(jobs)
			.values({
				assetId: asset.id,
				assignedEngineerId: engineer.id,
				createdByUserId: userId,
				description:
					input.description ??
					`Opportunistic PM while ${engineer.name} is on-site.`,
				hospitalId: asset.hospitalId,
				jobNumber,
				priority: "normal",
				scheduledStartAt: toTimestampValue(input.scheduledStartAt),
				status: "assigned",
				tenantId,
				type: "preventive_maintenance",
			})
			.returning({ id: jobs.id });

		if (!job) {
			throw new Error("Unable to approve PM opportunity");
		}

		jobId = job.id;
		await tx
			.update(opportunisticPmAlerts)
			.set({ status: "approved" })
			.where(
				and(
					eq(opportunisticPmAlerts.id, alertId),
					eq(opportunisticPmAlerts.tenantId, tenantId)
				)
			);
		await tx.insert(jobStateEvents).values({
			actorUserId: userId,
			eventLabel: "Created from PM opportunity alert",
			jobId: job.id,
			tenantId,
			toStatus: "assigned",
		});
	});

	await queueNotification({
		body: `${jobNumber} was assigned while you are on-site.`,
		engineerId: engineer.id,
		jobId,
		tenantId,
		title: "PM opportunity approved",
		type: "job_assigned",
	});
	await createWebsocketEvent({
		entityId: jobId,
		entityType: "job",
		eventType: "pm.opportunity_approved",
		payload: { alertId },
		tenantId,
	});
}

export async function clockEngineer(
	tenantId: string,
	engineerId: string,
	eventType: typeof engineerClockEvents.$inferInsert.eventType,
	input: {
		accuracyMeters?: null | number;
		latitude?: null | number;
		longitude?: null | number;
	}
) {
	await getTenantEngineerRecord(tenantId, engineerId);
	await db.transaction(async (tx) => {
		await tx.insert(engineerClockEvents).values({
			accuracyMeters:
				input.accuracyMeters === null || input.accuracyMeters === undefined
					? null
					: String(input.accuracyMeters),
			engineerId,
			eventType,
			latitude:
				input.latitude === null || input.latitude === undefined
					? null
					: String(input.latitude),
			longitude:
				input.longitude === null || input.longitude === undefined
					? null
					: String(input.longitude),
			tenantId,
		});
		await tx
			.update(engineers)
			.set({ status: eventType === "clock_in" ? "idle" : "off_duty" })
			.where(
				and(eq(engineers.id, engineerId), eq(engineers.tenantId, tenantId))
			);
	});
}

export async function recordEngineerLocation(
	tenantId: string,
	engineerId: string,
	input: {
		accuracyMeters?: null | number;
		jobId?: null | string;
		latitude: number;
		longitude: number;
	}
) {
	await getTenantEngineerRecord(tenantId, engineerId);
	await validateOptionalTenantRecord(tenantId, input.jobId, getTenantJobRecord);
	await db.insert(engineerLocations).values({
		accuracyMeters:
			input.accuracyMeters === null || input.accuracyMeters === undefined
				? null
				: String(input.accuracyMeters),
		engineerId,
		jobId: input.jobId ?? null,
		latitude: String(input.latitude),
		longitude: String(input.longitude),
		tenantId,
	});
	await detectGeofenceTimerAnomaly(tenantId, engineerId, input);
	if (input.jobId) {
		const job = await getTenantJobRecord(tenantId, input.jobId);
		await detectOpportunisticPm(tenantId, engineerId, job.hospitalId, job.id);
	}
	await createWebsocketEvent({
		entityId: engineerId,
		entityType: "engineer_location",
		eventType: "engineer.location_updated",
		tenantId,
	});
}
