import { db } from "@luke/db";
import {
	assets,
	contractModelCoverage,
	contracts,
	engineers,
	faultReports,
	geofenceEvents,
	hospitals,
	jobCosts,
	jobStateEvents,
	jobs,
	jobTimers,
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

const numberFrom = (value: null | string): number => Number(value ?? 0);

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

const getHospitals = async (tenantId: string): Promise<Hospital[]> => {
	const rows = await db
		.select({
			assetCount: sql<number>`count(distinct ${assets.id})`.mapWith(Number),
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
		.where(eq(hospitals.tenantId, tenantId))
		.groupBy(
			hospitals.id,
			hospitals.name,
			hospitals.district,
			hospitals.latitude,
			hospitals.longitude
		)
		.orderBy(asc(hospitals.name));

	return rows.map((row) => ({
		assets: row.assetCount,
		contractStatus: row.contractStatus
			? mapContractStatus(row.contractStatus)
			: "Expired",
		district: row.district,
		id: row.id,
		lat: numberFrom(row.latitude),
		lng: numberFrom(row.longitude),
		name: row.name,
		openJobs: row.openJobs,
	}));
};

const getEngineers = async (tenantId: string): Promise<Engineer[]> => {
	const rows = await db
		.select({
			currentJob: jobs.jobNumber,
			grade: engineers.grade,
			hourlyRateHkd: engineers.hourlyRateHkd,
			id: engineers.id,
			mealCapHkd: engineers.mealCapHkd,
			mileageRateHkdPerKm: engineers.mileageRateHkdPerKm,
			name: engineers.name,
			region: engineers.region,
			status: engineers.status,
		})
		.from(engineers)
		.leftJoin(
			jobs,
			and(
				eq(jobs.assignedEngineerId, engineers.id),
				ne(jobs.status, "completed"),
				ne(jobs.status, "cancelled")
			)
		)
		.where(eq(engineers.tenantId, tenantId))
		.orderBy(asc(engineers.code));

	return rows.map((row) => ({
		currentJob: row.currentJob ?? "Available",
		grade: row.grade,
		hourlyRate: numberFrom(row.hourlyRateHkd),
		id: row.id,
		mealCap: numberFrom(row.mealCapHkd),
		mileageRate: numberFrom(row.mileageRateHkdPerKm),
		name: row.name,
		region: row.region,
		status: mapEngineerStatus(row.status),
	}));
};

const getAssets = async (tenantId: string): Promise<Asset[]> => {
	const rows = await db
		.select({
			assetNumber: assets.assetNumber,
			contractCoverageStatus: assets.contractCoverageStatus,
			designatedEngineer: engineers.name,
			hospital: hospitals.name,
			locationLabel: assets.locationLabel,
			modelName: productModels.modelName,
			nextPmDueDate: assets.nextPmDueDate,
			nfcUid: assets.nfcUid,
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
		.where(eq(assets.tenantId, tenantId))
		.orderBy(asc(assets.assetNumber));

	return rows.map((row) => ({
		contractCoverage: mapCoverage(row.contractCoverageStatus),
		designatedEngineer: row.designatedEngineer ?? "Unassigned",
		hospital: row.hospital,
		id: row.assetNumber,
		location: row.locationLabel,
		model: row.modelName,
		nextPmDue: dateOnly(row.nextPmDueDate),
		nfcUid: row.nfcUid,
		serial: row.serialNumber,
		warrantyExpiry: dateOnly(row.warrantyExpiryDate),
	}));
};

const getJobs = async (tenantId: string): Promise<Job[]> => {
	const rows = await db
		.select({
			assetNumber: assets.assetNumber,
			audit: jobStateEvents.eventLabel,
			cost: jobCosts.labourCostHkd,
			engineerName: engineers.name,
			hospitalName: hospitals.name,
			jobNumber: jobs.jobNumber,
			priority: jobs.priority,
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
			audit: row.audit ?? "No state events recorded",
			cost: Math.round(numberFrom(row.cost)),
			engineer: row.engineerName ?? "Unassigned",
			hospital: row.hospitalName,
			id: row.jobNumber,
			priority: mapPriority(row.priority),
			scheduledFor: dateLabel(row.scheduledStartAt),
			status: mapJobStatus(row.status),
			timerMinutes: row.timerMinutes ?? 0,
			type: mapJobType(row.type),
		});
	}

	return mapped;
};

const getProducts = async (tenantId: string): Promise<ProductModel[]> => {
	const rows = await db
		.select({
			defaultPmCycleMonths: productModels.defaultPmCycleMonths,
			isEngineerReadOnly: productModels.isEngineerReadOnly,
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
			defaultPmCycleMonths: row.defaultPmCycleMonths,
			engineerAccess: row.isEngineerReadOnly ? "Read-only" : "Editable",
			id: row.productModelId,
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
			endDate: contracts.endDate,
			hospitalName: hospitals.name,
			modelName: productModels.modelName,
			responseSlaHours: contracts.responseSlaHours,
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

			continue;
		}

		byContract.set(row.contractNumber, {
			accountManager: row.accountManagerName,
			coveredModels: row.modelName ? [row.modelName] : [],
			expiry: row.endDate,
			hospital: row.hospitalName,
			id: row.contractNumber,
			slaHours: row.responseSlaHours,
			status: mapContractStatus(row.status),
			type: mapContractType(row.type),
		});
	}

	return Array.from(byContract.values());
};

const getFaultReports = async (tenantId: string): Promise<FaultReport[]> => {
	const rows = await db
		.select({
			assetNumber: assets.assetNumber,
			createdAt: faultReports.createdAt,
			description: faultReports.description,
			hospitalName: hospitals.name,
			reportNumber: faultReports.reportNumber,
			severity: faultReports.severity,
			status: faultReports.status,
		})
		.from(faultReports)
		.innerJoin(hospitals, eq(hospitals.id, faultReports.hospitalId))
		.leftJoin(assets, eq(assets.id, faultReports.assetId))
		.where(eq(faultReports.tenantId, tenantId))
		.orderBy(desc(faultReports.createdAt));

	return rows.map((row) => ({
		asset: row.assetNumber ?? "Manual lookup",
		description: row.description,
		hospital: row.hospitalName,
		id: row.reportNumber,
		severity: mapSeverity(row.severity),
		status: mapFaultStatus(row.status),
		submittedAt: dateLabel(row.createdAt),
	}));
};

const getParts = async (tenantId: string): Promise<Part[]> => {
	const rows = await db
		.select({
			minimumStock: partInventory.minimumStock,
			name: parts.name,
			partNumber: parts.partNumber,
			stockOnHand: partInventory.stockOnHand,
			supplier: parts.supplier,
			unitCostHkd: parts.unitCostHkd,
		})
		.from(parts)
		.leftJoin(partInventory, eq(partInventory.partId, parts.id))
		.where(eq(parts.tenantId, tenantId))
		.orderBy(asc(parts.partNumber));

	return rows.map((row) => ({
		id: row.partNumber,
		minimum: row.minimumStock ?? 0,
		name: row.name,
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

	return [
		{
			id: "jobs",
			label: "Jobs completed",
			value: String(metrics?.jobsCompleted ?? 0),
			trend: "+18% vs last month",
		},
		{
			id: "resolution",
			label: "Avg resolution",
			value: `${metrics?.averageResolutionHours ?? 0}h`,
			trend: "-1.1h vs last month",
		},
		{
			id: "firstFix",
			label: "First-fix rate",
			value: `${Math.round((metrics?.firstFixRate ?? 0) * 100)}%`,
			trend: "+6% vs last month",
		},
		{
			id: "cost",
			label: "Billable parts",
			value: formatMoney(String(metrics?.billablePartsHkd ?? 0)),
			trend: "32% out of contract",
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
