import { db } from "@luke/db";
import {
	assets,
	contractModelCoverage,
	contractPartCoverage,
	contracts,
	engineers,
	faultReports,
	geofenceEvents,
	hospitals,
	jobCosts,
	jobExpenses,
	jobPartsUsage,
	jobStateEvents,
	jobs,
	jobTimers,
	nfcEvents,
	nfcTags,
	opportunisticPmAlerts,
	partInventory,
	parts,
	partsShortages,
	productModelParts,
	productModels,
	reportSnapshots,
	serviceManualSections,
	serviceManuals,
	systemParameters,
	tenantMemberships,
	tenants,
} from "@luke/db/schema/service-ops";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
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
	Part,
	Priority,
	ProductModel,
	ReportMetric,
	ServiceOpsSnapshot,
	SystemParameter,
} from "../types/service-ops";

type TenantRow = typeof tenants.$inferSelect;
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
}

export interface PartMutationInput {
	minimumStock: number;
	name: string;
	partNumber: string;
	stockOnHand: number;
	supplier: string;
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

const defaultRegion = "Hong Kong";
const defaultReleaseLabel = "Early Release v1";
const maxTenantIdLength = 56;
const nonAlphanumericRegex = /[^a-z0-9]+/g;
const edgeHyphenRegex = /^-+|-+$/g;

const defaultSystemParameters = [
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
		description: "Advance window for opportunistic PM alerts.",
		key: "pm_advance_window_days",
		value: 2,
		valueType: "number",
	},
] as const;

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
		resumed: "In Progress",
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

const mapCoverage = (
	status: typeof assets.$inferSelect.contractCoverageStatus
): Asset["contractCoverage"] => {
	const labels: Record<typeof status, Asset["contractCoverage"]> = {
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

export async function getDefaultTenantIdForUser(
	userId: string
): Promise<string | null> {
	const [membership] = await db
		.select({ tenantId: tenantMemberships.tenantId })
		.from(tenantMemberships)
		.where(
			and(
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
				role: "admin",
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

export async function userCanAccessTenant(
	userId: string,
	tenantId: string
): Promise<boolean> {
	const [membership] = await db
		.select({ id: tenantMemberships.id })
		.from(tenantMemberships)
		.where(
			and(
				eq(tenantMemberships.userId, userId),
				eq(tenantMemberships.tenantId, tenantId),
				eq(tenantMemberships.status, "active")
			)
		)
		.limit(1);

	return Boolean(membership);
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

const toNullableString = (value: null | string | undefined): null | string =>
	value?.trim() ? value.trim() : null;

const toDateValue = (value: null | string | undefined): null | string =>
	value?.trim() ? value.trim() : null;

const toTimestampValue = (value: null | string | undefined): Date | null =>
	value?.trim() ? new Date(value) : null;

const toMoneyValue = (value: number): string => value.toFixed(2);

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

const getTenantPartRecord = (tenantId: string, id: string) =>
	ensureRecordBelongsToTenant(
		"Part",
		db.query.parts.findFirst({
			where: and(eq(parts.id, id), eq(parts.tenantId, tenantId)),
		})
	);

const getTenantAssetRecord = (tenantId: string, id: string) =>
	ensureRecordBelongsToTenant(
		"Asset",
		db.query.assets.findFirst({
			where: and(eq(assets.id, id), eq(assets.tenantId, tenantId)),
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
			hospitals.primaryContactPhone
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

	return rows.map((row) => ({
		code: row.code,
		currentJob: currentJobByEngineerId.get(row.id) ?? "Available",
		email: row.email,
		grade: row.grade,
		hourlyRate: numberFrom(row.hourlyRateHkd),
		id: row.id,
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

const getProducts = async (tenantId: string): Promise<ProductModel[]> => {
	const rows = await db
		.select({
			category: productModels.category,
			code: productModels.code,
			defaultPmCycleMonths: productModels.defaultPmCycleMonths,
			isEngineerReadOnly: productModels.isEngineerReadOnly,
			manufacturer: productModels.manufacturer,
			manualFileName: serviceManuals.fileName,
			modelName: productModels.modelName,
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

			continue;
		}

		byModel.set(row.productModelId, {
			category: row.category,
			code: row.code,
			defaultPmCycleMonths: row.defaultPmCycleMonths,
			engineerAccess: row.isEngineerReadOnly ? "Read-only" : "Editable",
			id: row.productModelId,
			isEngineerReadOnly: row.isEngineerReadOnly,
			manufacturer: row.manufacturer,
			manualFileName: row.manualFileName ?? "Not uploaded",
			modelName: row.modelName,
			partsList: row.partName ? [row.partName] : [],
		});
	}

	return Array.from(byModel.values());
};

const getContracts = async (tenantId: string): Promise<Contract[]> => {
	const rows = await db
		.select({
			accountManagerName: contracts.accountManagerName,
			contractNumber: contracts.contractNumber,
			contractId: contracts.id,
			endDate: contracts.endDate,
			hospitalId: contracts.hospitalId,
			hospitalName: hospitals.name,
			productModelId: productModels.id,
			modelName: productModels.modelName,
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
		.where(eq(contracts.tenantId, tenantId))
		.orderBy(asc(contracts.contractNumber));

	const byContract = new Map<string, Contract>();

	for (const row of rows) {
		const existing = byContract.get(row.contractNumber);

		if (existing) {
			if (row.modelName) {
				existing.coveredModels.push(row.modelName);
			}
			if (row.productModelId) {
				existing.coveredModelIds.push(row.productModelId);
			}

			continue;
		}

		byContract.set(row.contractNumber, {
			accountManager: row.accountManagerName,
			coveredModelIds: row.productModelId ? [row.productModelId] : [],
			coveredModels: row.modelName ? [row.modelName] : [],
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
			minimumStock: partInventory.minimumStock,
			name: parts.name,
			partNumber: parts.partNumber,
			recordId: parts.id,
			stockOnHand: partInventory.stockOnHand,
			supplier: parts.supplier,
			unitCostHkd: parts.unitCostHkd,
		})
		.from(parts)
		.leftJoin(partInventory, eq(partInventory.partId, parts.id))
		.where(and(eq(parts.tenantId, tenantId), eq(parts.isActive, true)))
		.orderBy(asc(parts.partNumber));

	return rows.map((row) => ({
		id: row.partNumber,
		minimum: row.minimumStock ?? 0,
		name: row.name,
		recordId: row.recordId,
		stock: row.stockOnHand ?? 0,
		supplier: row.supplier,
		unitCost: numberFrom(row.unitCostHkd),
	}));
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
			partName: parts.name,
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
		part: row.partName,
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
		})
		.from(opportunisticPmAlerts)
		.innerJoin(engineers, eq(engineers.id, opportunisticPmAlerts.engineerId))
		.innerJoin(assets, eq(assets.id, opportunisticPmAlerts.assetId))
		.innerJoin(hospitals, eq(hospitals.id, assets.hospitalId))
		.where(eq(opportunisticPmAlerts.tenantId, tenantId))
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
	tenantId: string
): Promise<ServiceOpsSnapshot> {
	const tenant = await getTenant(tenantId);
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
	]);

	return {
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
	};
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
	await db.insert(productModels).values({
		category: input.category,
		code: input.code,
		defaultPmCycleMonths: input.defaultPmCycleMonths,
		isEngineerReadOnly: input.isEngineerReadOnly,
		manufacturer: input.manufacturer,
		modelName: input.modelName,
		tenantId,
	} satisfies ProductInsert);
}

export async function updateProduct(
	tenantId: string,
	id: string,
	input: ProductMutationInput
) {
	await getTenantProductRecord(tenantId, id);
	await db
		.update(productModels)
		.set({
			category: input.category,
			code: input.code,
			defaultPmCycleMonths: input.defaultPmCycleMonths,
			isEngineerReadOnly: input.isEngineerReadOnly,
			manufacturer: input.manufacturer,
			modelName: input.modelName,
		})
		.where(and(eq(productModels.id, id), eq(productModels.tenantId, tenantId)));
}

export async function deleteProduct(tenantId: string, id: string) {
	await getTenantProductRecord(tenantId, id);
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
	await db.transaction(async (tx) => {
		const [part] = await tx
			.insert(parts)
			.values({
				name: input.name,
				partNumber: input.partNumber,
				supplier: input.supplier,
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
	});
}

export async function updatePart(
	tenantId: string,
	id: string,
	input: PartMutationInput
) {
	await getTenantPartRecord(tenantId, id);
	await db.transaction(async (tx) => {
		await tx
			.update(parts)
			.set({
				name: input.name,
				partNumber: input.partNumber,
				supplier: input.supplier,
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
			return;
		}

		await tx.insert(partInventory).values({
			minimumStock: input.minimumStock,
			partId: id,
			stockOnHand: input.stockOnHand,
			tenantId,
		});
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
				status: input.status,
				tenantId,
				type: input.type,
			} satisfies JobInsert)
			.returning({ id: jobs.id });

		if (!job) {
			throw new Error("Unable to create job");
		}

		await tx.insert(jobStateEvents).values({
			actorUserId: userId,
			eventLabel: `Created with ${titleCase(input.status)} status`,
			jobId: job.id,
			tenantId,
			toStatus: input.status,
		});
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
				status: input.status,
				type: input.type,
			})
			.where(and(eq(jobs.id, id), eq(jobs.tenantId, tenantId)));

		if (existingJob.status !== input.status) {
			await tx.insert(jobStateEvents).values({
				actorUserId: userId,
				eventLabel: `Status changed to ${titleCase(input.status)}`,
				fromStatus: existingJob.status,
				jobId: id,
				tenantId,
				toStatus: input.status,
			});
		}
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
