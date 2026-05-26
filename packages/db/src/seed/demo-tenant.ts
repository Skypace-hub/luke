import { hashPassword } from "better-auth/crypto";
import dotenv from "dotenv";
import { and, eq, or } from "drizzle-orm";

dotenv.config({ path: "../../apps/web/.env" });

import { account, user } from "../schema/auth";
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
} from "../schema/service-ops";

const { db } = await import("../index");

const demoTenantId = "arjo-hk";
const demoTenantName = "ARJO HONG KONG";
const adminEmail = "admin@utiliti.local";
const adminPassword = "admin";
const adminUserId = "demo-admin-user";
const adminCredentialAccountId = "demo-admin-credential";

const ids = {
	assets: {
		alenti: "113757f1-edb1-4bc3-a240-8dc9a8e2647a",
		citadel: "7e3e057d-ab7e-4702-a1e7-f46240947943",
		maxiMove: "9d99b6c0-0ae7-4641-9e17-3363a64084f4",
		saraFlex: "aad49266-c13d-437e-b048-1b16b1a6a405",
	},
	contracts: {
		active: "6ddb1e22-89ce-467e-b50e-0150e3b345fa",
		expired: "94af31f0-5a99-4db7-a200-77077b0bebbc",
		expiring: "922142fa-73c2-4781-88ac-a424de224d9f",
	},
	engineers: {
		arun: "d0721d79-2c9e-4e9e-8d94-f18750184fa9",
		ivy: "90153a22-1555-438e-8faa-580d7bd47b89",
		kelvin: "b124caa1-5a3b-4e94-817e-ae449d8cd4cf",
		mandy: "c79b592f-6eb5-4ba6-a922-66bdd0b631d4",
	},
	expenses: {
		j1032Meal: "657ca1d4-d0cf-4e51-aa29-2191825cabe9",
		j1048Mileage: "13b99ec2-5662-44b2-8905-08c1c904680f",
	},
	faultReports: {
		f2199: "6ca1badd-5ee8-4c7f-900d-ecbab84c15f8",
		f2207: "76e766de-65a9-4361-8147-b7ddaaccaebc",
		f2208: "c11c5df0-8524-4d27-b47b-98a50c4abd17",
	},
	hospitals: {
		pmh: "402ba886-b13c-4f8c-b572-8b22ce4a1e8f",
		pwh: "c3e128db-9fdd-4ef7-aeed-1f05232a623f",
		qmh: "b124caa1-5a3b-4e94-817e-ae449d8cd4cf",
		uch: "6afbecea-7212-47f3-8227-96317bddde5c",
	},
	jobs: {
		j1032: "00233b4c-91a8-4451-8897-1000c166ce6e",
		j1038: "5bf119c8-d495-492a-b332-90b59a3e4f29",
		j1041: "36a592a0-8a52-451e-96dc-80250a8145b9",
		j1048: "b3865acd-8d8c-400d-9355-500d3f8f6880",
		j1049: "b833b30a-8025-436b-af3a-03b1f9f0438a",
	},
	manualSections: {
		batteryFault: "48a12da4-e83e-43f4-8b08-10f3b190fb49",
		safeWorkingLoad: "3fa70493-f436-419f-9a2e-2232ff7b2bcc",
		slingBar: "7aae8db1-ae9f-46cb-895c-e5ecca0c435b",
	},
	manuals: {
		maxiMove: "1be99bef-028c-409b-8283-250ee3160854",
		saraFlex: "3e84f170-d9ab-45ef-9697-d9e8845469ec",
	},
	parts: {
		battery: "4f6bc781-5541-4713-9b36-788aeae5b215",
		castor: "29bbb82f-af52-4343-8934-d7dece5e0cff",
		slingBar: "5908458a-1946-4d3f-b0a0-e2d4b23fae54",
	},
	productModels: {
		alenti: "1e96bdde-262e-4856-be0b-f65006d4297a",
		citadel: "83e9e7ff-2609-43c4-af74-dd7c467b3cb1",
		maxiMove: "c67c7d50-22c1-451f-81bb-1d00c305535e",
		saraFlex: "1d90467a-1a41-428c-b29c-30cf29c1fe6c",
	},
};

const at = (value: string) => new Date(value);

async function resetDemoTenant() {
	await db
		.delete(websocketEvents)
		.where(eq(websocketEvents.tenantId, demoTenantId));
	await db
		.delete(reportSnapshots)
		.where(eq(reportSnapshots.tenantId, demoTenantId));
	await db
		.delete(pushNotifications)
		.where(eq(pushNotifications.tenantId, demoTenantId));
	await db
		.delete(systemParameters)
		.where(eq(systemParameters.tenantId, demoTenantId));
	await db
		.delete(fileAttachments)
		.where(eq(fileAttachments.tenantId, demoTenantId));
	await db
		.delete(manualQaQueries)
		.where(eq(manualQaQueries.tenantId, demoTenantId));
	await db
		.delete(serviceManualSections)
		.where(eq(serviceManualSections.tenantId, demoTenantId));
	await db
		.delete(serviceManuals)
		.where(eq(serviceManuals.tenantId, demoTenantId));
	await db.delete(jobCosts).where(eq(jobCosts.tenantId, demoTenantId));
	await db.delete(jobExpenses).where(eq(jobExpenses.tenantId, demoTenantId));
	await db
		.delete(jobPartsUsage)
		.where(eq(jobPartsUsage.tenantId, demoTenantId));
	await db
		.delete(partsShortages)
		.where(eq(partsShortages.tenantId, demoTenantId));
	await db
		.delete(partInventory)
		.where(eq(partInventory.tenantId, demoTenantId));
	await db.delete(faultReports).where(eq(faultReports.tenantId, demoTenantId));
	await db
		.delete(opportunisticPmAlerts)
		.where(eq(opportunisticPmAlerts.tenantId, demoTenantId));
	await db
		.delete(geofenceEvents)
		.where(eq(geofenceEvents.tenantId, demoTenantId));
	await db
		.delete(engineerLocations)
		.where(eq(engineerLocations.tenantId, demoTenantId));
	await db
		.delete(engineerClockEvents)
		.where(eq(engineerClockEvents.tenantId, demoTenantId));
	await db.delete(jobTimers).where(eq(jobTimers.tenantId, demoTenantId));
	await db.delete(nfcEvents).where(eq(nfcEvents.tenantId, demoTenantId));
	await db
		.delete(jobStateEvents)
		.where(eq(jobStateEvents.tenantId, demoTenantId));
	await db.delete(jobs).where(eq(jobs.tenantId, demoTenantId));
	await db.delete(nfcTags).where(eq(nfcTags.tenantId, demoTenantId));
	await db.delete(assets).where(eq(assets.tenantId, demoTenantId));
	await db
		.delete(contractPartCoverage)
		.where(eq(contractPartCoverage.tenantId, demoTenantId));
	await db
		.delete(contractModelCoverage)
		.where(eq(contractModelCoverage.tenantId, demoTenantId));
	await db.delete(contracts).where(eq(contracts.tenantId, demoTenantId));
	await db
		.delete(productModelParts)
		.where(eq(productModelParts.tenantId, demoTenantId));
	await db.delete(parts).where(eq(parts.tenantId, demoTenantId));
	await db
		.delete(productModels)
		.where(eq(productModels.tenantId, demoTenantId));
	await db.delete(engineers).where(eq(engineers.tenantId, demoTenantId));
	await db.delete(hospitals).where(eq(hospitals.tenantId, demoTenantId));
	await db
		.delete(tenantMemberships)
		.where(eq(tenantMemberships.tenantId, demoTenantId));
	await db.delete(tenants).where(eq(tenants.id, demoTenantId));
}

async function upsertDemoAdminUser() {
	const [existingAdmin] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, adminEmail))
		.limit(1);
	const now = new Date();
	const userId = existingAdmin?.id ?? adminUserId;

	if (existingAdmin) {
		await db
			.update(user)
			.set({ emailVerified: true, name: "Admin User", updatedAt: now })
			.where(eq(user.id, userId));
	} else {
		await db.insert(user).values({
			id: userId,
			name: "Admin User",
			email: adminEmail,
			emailVerified: true,
			createdAt: now,
			updatedAt: now,
		});
	}

	await db
		.delete(account)
		.where(
			or(
				eq(account.id, adminCredentialAccountId),
				and(eq(account.userId, userId), eq(account.providerId, "credential"))
			)
		);
	await db.insert(account).values({
		id: adminCredentialAccountId,
		accountId: userId,
		providerId: "credential",
		userId,
		password: await hashPassword(adminPassword),
		createdAt: now,
		updatedAt: now,
	});

	return userId;
}

async function seedReferenceData(adminId: string) {
	await db.insert(tenants).values({
		id: demoTenantId,
		name: demoTenantName,
		region: "Hong Kong",
		releaseLabel: "Early Release v1",
	});
	await db.insert(tenantMemberships).values({
		tenantId: demoTenantId,
		userId: adminId,
		role: "super_admin",
		status: "active",
		permissions: ["*"],
	});

	await db.insert(hospitals).values([
		{
			id: ids.hospitals.qmh,
			tenantId: demoTenantId,
			code: "QMH",
			name: "Queen Mary Hospital",
			district: "Pok Fu Lam",
			address: "102 Pok Fu Lam Road",
			latitude: "22.2707000",
			longitude: "114.1317000",
			primaryContactName: "Ward Operations",
			primaryContactEmail: "qmh.ops@example.com",
			primaryContactPhone: "+852 2255 3838",
		},
		{
			id: ids.hospitals.pwh,
			tenantId: demoTenantId,
			code: "PWH",
			name: "Prince of Wales Hospital",
			district: "Sha Tin",
			address: "30-32 Ngan Shing Street",
			latitude: "22.3798000",
			longitude: "114.2014000",
			primaryContactName: "Ward 10B nurse station",
			primaryContactEmail: "pwh.ward10b@example.com",
			primaryContactPhone: "+852 3505 2211",
		},
		{
			id: ids.hospitals.uch,
			tenantId: demoTenantId,
			code: "UCH",
			name: "United Christian Hospital",
			district: "Kwun Tong",
			address: "130 Hip Wo Street",
			latitude: "22.3186000",
			longitude: "114.2263000",
			primaryContactName: "ICU service desk",
			primaryContactEmail: "uch.icu@example.com",
			primaryContactPhone: "+852 3949 4000",
		},
		{
			id: ids.hospitals.pmh,
			tenantId: demoTenantId,
			code: "PMH",
			name: "Princess Margaret Hospital",
			district: "Lai Chi Kok",
			address: "2-10 Princess Margaret Hospital Road",
			latitude: "22.3401000",
			longitude: "114.1354000",
			primaryContactName: "Geriatrics utility desk",
			primaryContactEmail: "pmh.geriatrics@example.com",
			primaryContactPhone: "+852 2990 1111",
		},
	]);

	await db.insert(engineers).values([
		{
			id: ids.engineers.kelvin,
			tenantId: demoTenantId,
			code: "ENG-001",
			name: "Kelvin Wong",
			email: "kelvin.wong@example.com",
			phone: "+852 6111 0001",
			grade: "Senior Engineer",
			status: "on_site",
			region: "Hong Kong Island",
			hourlyRateHkd: "620.00",
			mileageRateHkdPerKm: "4.80",
			mealCapHkd: "95.00",
		},
		{
			id: ids.engineers.mandy,
			tenantId: demoTenantId,
			code: "ENG-002",
			name: "Mandy Chan",
			email: "mandy.chan@example.com",
			phone: "+852 6111 0002",
			grade: "Field Engineer",
			status: "in_transit",
			region: "New Territories East",
			hourlyRateHkd: "520.00",
			mileageRateHkdPerKm: "4.80",
			mealCapHkd: "85.00",
		},
		{
			id: ids.engineers.arun,
			tenantId: demoTenantId,
			code: "ENG-003",
			name: "Arun Patel",
			email: "arun.patel@example.com",
			phone: "+852 6111 0003",
			grade: "Field Engineer",
			status: "idle",
			region: "Kowloon",
			hourlyRateHkd: "500.00",
			mileageRateHkdPerKm: "4.80",
			mealCapHkd: "85.00",
		},
		{
			id: ids.engineers.ivy,
			tenantId: demoTenantId,
			code: "ENG-004",
			name: "Ivy Lee",
			email: "ivy.lee@example.com",
			phone: "+852 6111 0004",
			grade: "Lead Engineer",
			status: "timer_anomaly",
			region: "New Territories West",
			hourlyRateHkd: "680.00",
			mileageRateHkdPerKm: "5.20",
			mealCapHkd: "110.00",
		},
	]);

	await db.insert(productModels).values([
		{
			id: ids.productModels.maxiMove,
			tenantId: demoTenantId,
			code: "MAXI-MOVE",
			modelName: "Maxi Move Floor Lift",
			manufacturer: "Arjo",
			category: "Patient lift",
			defaultPmCycleMonths: 6,
		},
		{
			id: ids.productModels.saraFlex,
			tenantId: demoTenantId,
			code: "SARA-FLEX",
			modelName: "Sara Flex Standing Aid",
			manufacturer: "Arjo",
			category: "Standing aid",
			defaultPmCycleMonths: 6,
		},
		{
			id: ids.productModels.citadel,
			tenantId: demoTenantId,
			code: "CITADEL-PTS",
			modelName: "Citadel Patient Therapy System",
			manufacturer: "Arjo",
			category: "Therapy system",
			defaultPmCycleMonths: 3,
		},
		{
			id: ids.productModels.alenti,
			tenantId: demoTenantId,
			code: "ALENTI",
			modelName: "Alenti Hygiene Chair",
			manufacturer: "Arjo",
			category: "Hygiene chair",
			defaultPmCycleMonths: 6,
		},
	]);

	await db.insert(parts).values([
		{
			id: ids.parts.slingBar,
			tenantId: demoTenantId,
			partNumber: "P-4410",
			name: "Sling bar assembly",
			supplier: "Arjo HK",
			unitCostHkd: "1580.00",
		},
		{
			id: ids.parts.battery,
			tenantId: demoTenantId,
			partNumber: "P-3208",
			name: "Battery module 24V",
			supplier: "Arjo HK",
			unitCostHkd: "940.00",
		},
		{
			id: ids.parts.castor,
			tenantId: demoTenantId,
			partNumber: "P-2104",
			name: "Castor wheel kit",
			supplier: "MedSupply Asia",
			unitCostHkd: "180.00",
		},
	]);

	await db.insert(productModelParts).values([
		{
			tenantId: demoTenantId,
			productModelId: ids.productModels.maxiMove,
			partId: ids.parts.slingBar,
			defaultQuantity: 1,
		},
		{
			tenantId: demoTenantId,
			productModelId: ids.productModels.maxiMove,
			partId: ids.parts.castor,
			defaultQuantity: 4,
		},
		{
			tenantId: demoTenantId,
			productModelId: ids.productModels.saraFlex,
			partId: ids.parts.battery,
			defaultQuantity: 1,
		},
	]);

	await db.insert(contracts).values([
		{
			id: ids.contracts.active,
			tenantId: demoTenantId,
			hospitalId: ids.hospitals.qmh,
			contractNumber: "CTR-HK-2026-01",
			type: "full",
			status: "active",
			startDate: "2026-04-01",
			endDate: "2027-03-31",
			responseSlaHours: 4,
			accountManagerName: "Nicole Tang",
			primaryContactName: "Ward Operations",
			primaryContactEmail: "qmh.ops@example.com",
		},
		{
			id: ids.contracts.expiring,
			tenantId: demoTenantId,
			hospitalId: ids.hospitals.pwh,
			contractNumber: "CTR-HK-2025-18",
			type: "partial",
			status: "expiring",
			startDate: "2025-06-19",
			endDate: "2026-06-18",
			responseSlaHours: 8,
			accountManagerName: "Nicole Tang",
			primaryContactName: "Ward 10B nurse station",
			primaryContactEmail: "pwh.ward10b@example.com",
		},
		{
			id: ids.contracts.expired,
			tenantId: demoTenantId,
			hospitalId: ids.hospitals.pmh,
			contractNumber: "CTR-HK-2024-09",
			type: "emergency_only",
			status: "expired",
			startDate: "2024-05-01",
			endDate: "2026-04-30",
			responseSlaHours: 24,
			accountManagerName: "Samuel Hui",
			primaryContactName: "Geriatrics utility desk",
			primaryContactEmail: "pmh.geriatrics@example.com",
		},
	]);

	await db.insert(contractModelCoverage).values([
		{
			tenantId: demoTenantId,
			contractId: ids.contracts.active,
			productModelId: ids.productModels.maxiMove,
			coverageStatus: "in_contract",
		},
		{
			tenantId: demoTenantId,
			contractId: ids.contracts.active,
			productModelId: ids.productModels.saraFlex,
			coverageStatus: "in_contract",
		},
		{
			tenantId: demoTenantId,
			contractId: ids.contracts.expiring,
			productModelId: ids.productModels.saraFlex,
			coverageStatus: "in_contract",
		},
		{
			tenantId: demoTenantId,
			contractId: ids.contracts.expired,
			productModelId: ids.productModels.alenti,
			coverageStatus: "expired",
		},
	]);
	await db.insert(contractPartCoverage).values([
		{
			tenantId: demoTenantId,
			contractId: ids.contracts.active,
			partId: ids.parts.slingBar,
			coverageStatus: "out_of_contract",
		},
		{
			tenantId: demoTenantId,
			contractId: ids.contracts.active,
			partId: ids.parts.castor,
			coverageStatus: "in_contract",
		},
		{
			tenantId: demoTenantId,
			contractId: ids.contracts.expiring,
			partId: ids.parts.battery,
			coverageStatus: "in_contract",
		},
	]);

	await db.insert(assets).values([
		{
			id: ids.assets.maxiMove,
			tenantId: demoTenantId,
			assetNumber: "AST-10024",
			productModelId: ids.productModels.maxiMove,
			hospitalId: ids.hospitals.qmh,
			serialNumber: "MM-HK-23091",
			locationLabel: "Block K / 7F / Room 12",
			installationDate: "2024-09-30",
			warrantyExpiryDate: "2027-09-30",
			nextPmDueDate: "2026-05-27",
			designatedEngineerId: ids.engineers.kelvin,
			contractCoverageStatus: "in_contract",
			nfcUid: "nfc:arjo:10024",
		},
		{
			id: ids.assets.saraFlex,
			tenantId: demoTenantId,
			assetNumber: "AST-10031",
			productModelId: ids.productModels.saraFlex,
			hospitalId: ids.hospitals.pwh,
			serialNumber: "SF-HK-22930",
			locationLabel: "Ward 10B / Bay 3",
			installationDate: "2024-07-18",
			warrantyExpiryDate: "2026-07-18",
			nextPmDueDate: "2026-05-26",
			designatedEngineerId: ids.engineers.mandy,
			contractCoverageStatus: "in_contract",
			nfcUid: "nfc:arjo:10031",
		},
		{
			id: ids.assets.citadel,
			tenantId: demoTenantId,
			assetNumber: "AST-10047",
			productModelId: ids.productModels.citadel,
			hospitalId: ids.hospitals.uch,
			serialNumber: "CT-HK-24112",
			locationLabel: "ICU / Bed 5",
			installationDate: "2025-01-14",
			warrantyExpiryDate: "2028-01-14",
			nextPmDueDate: "2026-06-05",
			designatedEngineerId: ids.engineers.arun,
			contractCoverageStatus: "billable_exception",
			nfcUid: "nfc:arjo:10047",
		},
		{
			id: ids.assets.alenti,
			tenantId: demoTenantId,
			assetNumber: "AST-10052",
			productModelId: ids.productModels.alenti,
			hospitalId: ids.hospitals.pmh,
			serialNumber: "AH-HK-22501",
			locationLabel: "Geriatrics / Utility Room",
			installationDate: "2023-12-01",
			warrantyExpiryDate: "2025-12-01",
			nextPmDueDate: "2026-05-25",
			designatedEngineerId: ids.engineers.ivy,
			contractCoverageStatus: "expired",
			nfcUid: "nfc:arjo:10052",
		},
	]);

	await db.insert(nfcTags).values([
		{
			tenantId: demoTenantId,
			assetId: ids.assets.maxiMove,
			uid: "nfc:arjo:10024",
			ndefPayload: { uid: "nfc:arjo:10024", v: 1 },
			status: "commissioned",
			commissionedByEngineerId: ids.engineers.kelvin,
			commissionedAt: at("2024-09-30T09:00:00+08:00"),
		},
		{
			tenantId: demoTenantId,
			assetId: ids.assets.saraFlex,
			uid: "nfc:arjo:10031",
			ndefPayload: { uid: "nfc:arjo:10031", v: 1 },
			status: "commissioned",
			commissionedByEngineerId: ids.engineers.mandy,
			commissionedAt: at("2024-07-18T09:00:00+08:00"),
		},
		{
			tenantId: demoTenantId,
			assetId: ids.assets.citadel,
			uid: "nfc:arjo:10047",
			ndefPayload: { uid: "nfc:arjo:10047", v: 1 },
			status: "commissioned",
			commissionedByEngineerId: ids.engineers.arun,
			commissionedAt: at("2025-01-14T09:00:00+08:00"),
		},
		{
			tenantId: demoTenantId,
			assetId: ids.assets.alenti,
			uid: "nfc:arjo:10052",
			ndefPayload: { uid: "nfc:arjo:10052", v: 1 },
			status: "commissioned",
			commissionedByEngineerId: ids.engineers.ivy,
			commissionedAt: at("2023-12-01T09:00:00+08:00"),
		},
	]);

	await db.insert(jobs).values([
		{
			id: ids.jobs.j1048,
			tenantId: demoTenantId,
			jobNumber: "J-1048",
			type: "repair",
			status: "in_progress",
			priority: "urgent",
			assetId: ids.assets.maxiMove,
			hospitalId: ids.hospitals.qmh,
			assignedEngineerId: ids.engineers.kelvin,
			description: "Lift arm stops midway during patient transfer.",
			scheduledStartAt: at("2026-05-25T10:30:00+08:00"),
			actualStartedAt: at("2026-05-25T10:31:00+08:00"),
			createdByUserId: adminId,
		},
		{
			id: ids.jobs.j1049,
			tenantId: demoTenantId,
			jobNumber: "J-1049",
			type: "preventive_maintenance",
			status: "assigned",
			priority: "normal",
			assetId: ids.assets.saraFlex,
			hospitalId: ids.hospitals.pwh,
			assignedEngineerId: ids.engineers.mandy,
			description: "Routine PM due within configured advance window.",
			scheduledStartAt: at("2026-05-25T14:00:00+08:00"),
			createdByUserId: adminId,
		},
		{
			id: ids.jobs.j1041,
			tenantId: demoTenantId,
			jobNumber: "J-1041",
			type: "installation",
			status: "timer_anomaly",
			priority: "urgent",
			assetId: ids.assets.alenti,
			hospitalId: ids.hospitals.pmh,
			assignedEngineerId: ids.engineers.ivy,
			description: "Installation follow-up with open timer anomaly.",
			scheduledStartAt: at("2026-05-25T09:15:00+08:00"),
			actualStartedAt: at("2026-05-25T09:15:00+08:00"),
			createdByUserId: adminId,
		},
		{
			id: ids.jobs.j1038,
			tenantId: demoTenantId,
			jobNumber: "J-1038",
			type: "repair",
			status: "paused",
			priority: "normal",
			assetId: ids.assets.citadel,
			hospitalId: ids.hospitals.uch,
			assignedEngineerId: ids.engineers.arun,
			description: "Mattress pressure alarm intermittently active.",
			scheduledStartAt: at("2026-05-26T11:00:00+08:00"),
			actualStartedAt: at("2026-05-24T11:00:00+08:00"),
			createdByUserId: adminId,
		},
		{
			id: ids.jobs.j1032,
			tenantId: demoTenantId,
			jobNumber: "J-1032",
			type: "preventive_maintenance",
			status: "completed",
			priority: "normal",
			assetId: ids.assets.maxiMove,
			hospitalId: ids.hospitals.qmh,
			assignedEngineerId: ids.engineers.kelvin,
			description: "Routine PM completed and next PM due date written.",
			scheduledStartAt: at("2026-05-24T15:30:00+08:00"),
			actualStartedAt: at("2026-05-24T15:30:00+08:00"),
			actualCompletedAt: at("2026-05-24T16:34:00+08:00"),
			createdByUserId: adminId,
		},
	]);

	await db.insert(jobStateEvents).values([
		{
			tenantId: demoTenantId,
			jobId: ids.jobs.j1048,
			fromStatus: "assigned",
			toStatus: "in_progress",
			actorEngineerId: ids.engineers.kelvin,
			eventLabel: "NFC start accepted, geofence locked, GPS confirmed",
			createdAt: at("2026-05-25T10:31:00+08:00"),
		},
		{
			tenantId: demoTenantId,
			jobId: ids.jobs.j1049,
			fromStatus: "created",
			toStatus: "assigned",
			actorUserId: adminId,
			eventLabel: "Auto-filled from designated engineer",
			createdAt: at("2026-05-25T08:30:00+08:00"),
		},
		{
			tenantId: demoTenantId,
			jobId: ids.jobs.j1041,
			fromStatus: "in_progress",
			toStatus: "timer_anomaly",
			actorEngineerId: ids.engineers.ivy,
			eventLabel: "Engineer outside 200m geofence for 5 minutes",
			createdAt: at("2026-05-25T09:56:00+08:00"),
		},
		{
			tenantId: demoTenantId,
			jobId: ids.jobs.j1038,
			fromStatus: "in_progress",
			toStatus: "paused",
			actorEngineerId: ids.engineers.arun,
			eventLabel: "Paused for sling bar assembly shortage",
			createdAt: at("2026-05-24T12:12:00+08:00"),
		},
		{
			tenantId: demoTenantId,
			jobId: ids.jobs.j1032,
			fromStatus: "in_progress",
			toStatus: "completed",
			actorEngineerId: ids.engineers.kelvin,
			eventLabel: "Next PM date written to asset record",
			createdAt: at("2026-05-24T16:34:00+08:00"),
		},
	]);

	await db.insert(jobTimers).values([
		{
			tenantId: demoTenantId,
			jobId: ids.jobs.j1048,
			engineerId: ids.engineers.kelvin,
			startedAt: at("2026-05-25T10:31:00+08:00"),
			durationMinutes: 87,
		},
		{
			tenantId: demoTenantId,
			jobId: ids.jobs.j1041,
			engineerId: ids.engineers.ivy,
			startedAt: at("2026-05-25T09:15:00+08:00"),
			durationMinutes: 156,
			isAnomaly: true,
		},
		{
			tenantId: demoTenantId,
			jobId: ids.jobs.j1038,
			engineerId: ids.engineers.arun,
			startedAt: at("2026-05-24T11:00:00+08:00"),
			endedAt: at("2026-05-24T11:42:00+08:00"),
			durationMinutes: 42,
		},
		{
			tenantId: demoTenantId,
			jobId: ids.jobs.j1032,
			engineerId: ids.engineers.kelvin,
			startedAt: at("2026-05-24T15:30:00+08:00"),
			endedAt: at("2026-05-24T16:34:00+08:00"),
			durationMinutes: 64,
		},
	]);

	await db.insert(nfcEvents).values([
		{
			tenantId: demoTenantId,
			assetId: ids.assets.maxiMove,
			jobId: ids.jobs.j1048,
			engineerId: ids.engineers.kelvin,
			eventType: "job_start",
			readUid: "nfc:arjo:10024",
			expectedUid: "nfc:arjo:10024",
			accepted: true,
			createdAt: at("2026-05-25T10:31:00+08:00"),
		},
		{
			tenantId: demoTenantId,
			assetId: ids.assets.maxiMove,
			jobId: ids.jobs.j1032,
			engineerId: ids.engineers.kelvin,
			eventType: "job_end",
			readUid: "nfc:arjo:10024",
			expectedUid: "nfc:arjo:10024",
			accepted: true,
			createdAt: at("2026-05-24T16:34:00+08:00"),
		},
	]);

	await db.insert(engineerClockEvents).values([
		{
			tenantId: demoTenantId,
			engineerId: ids.engineers.kelvin,
			eventType: "clock_in",
			latitude: "22.2707100",
			longitude: "114.1317100",
			accuracyMeters: "12.00",
			recordedAt: at("2026-05-25T08:05:00+08:00"),
		},
		{
			tenantId: demoTenantId,
			engineerId: ids.engineers.ivy,
			eventType: "clock_in",
			latitude: "22.3401000",
			longitude: "114.1354000",
			accuracyMeters: "15.00",
			recordedAt: at("2026-05-25T08:10:00+08:00"),
		},
	]);
	await db.insert(engineerLocations).values([
		{
			tenantId: demoTenantId,
			engineerId: ids.engineers.kelvin,
			jobId: ids.jobs.j1048,
			latitude: "22.2707200",
			longitude: "114.1317300",
			accuracyMeters: "8.00",
			recordedAt: at("2026-05-25T11:58:00+08:00"),
		},
		{
			tenantId: demoTenantId,
			engineerId: ids.engineers.mandy,
			jobId: ids.jobs.j1049,
			latitude: "22.3710000",
			longitude: "114.1870000",
			accuracyMeters: "18.00",
			recordedAt: at("2026-05-25T11:56:00+08:00"),
		},
		{
			tenantId: demoTenantId,
			engineerId: ids.engineers.ivy,
			jobId: ids.jobs.j1041,
			latitude: "22.3449000",
			longitude: "114.1398000",
			accuracyMeters: "20.00",
			recordedAt: at("2026-05-25T11:57:00+08:00"),
		},
	]);
	await db.insert(geofenceEvents).values([
		{
			tenantId: demoTenantId,
			jobId: ids.jobs.j1041,
			engineerId: ids.engineers.ivy,
			hospitalId: ids.hospitals.pmh,
			eventType: "timer_anomaly",
			latitude: "22.3449000",
			longitude: "114.1398000",
			distanceMeters: "621.00",
			radiusMeters: 200,
			createdAt: at("2026-05-25T09:56:00+08:00"),
		},
	]);
	await db.insert(opportunisticPmAlerts).values([
		{
			tenantId: demoTenantId,
			engineerId: ids.engineers.kelvin,
			assetId: ids.assets.maxiMove,
			sourceJobId: ids.jobs.j1048,
			pmDueDate: "2026-05-27",
			daysUntilDue: 2,
			status: "open",
			createdAt: at("2026-05-25T10:40:00+08:00"),
		},
	]);

	await db.insert(faultReports).values([
		{
			id: ids.faultReports.f2208,
			tenantId: demoTenantId,
			reportNumber: "F-2208",
			hospitalId: ids.hospitals.qmh,
			assetId: ids.assets.maxiMove,
			convertedJobId: ids.jobs.j1048,
			source: "hospital_web",
			severity: "critical",
			status: "engineer_assigned",
			submittedByName: "Ward Operations",
			submittedByContact: "qmh.ops@example.com",
			description: "Lift arm stops midway during transfer.",
			createdAt: at("2026-05-25T09:42:00+08:00"),
		},
		{
			id: ids.faultReports.f2207,
			tenantId: demoTenantId,
			reportNumber: "F-2207",
			hospitalId: ids.hospitals.pwh,
			assetId: ids.assets.saraFlex,
			source: "hospital_web",
			severity: "high",
			status: "received",
			submittedByName: "Ward 10B nurse station",
			submittedByContact: "pwh.ward10b@example.com",
			description: "Standing aid battery does not hold charge.",
			createdAt: at("2026-05-25T08:16:00+08:00"),
		},
		{
			id: ids.faultReports.f2199,
			tenantId: demoTenantId,
			reportNumber: "F-2199",
			hospitalId: ids.hospitals.uch,
			assetId: ids.assets.citadel,
			convertedJobId: ids.jobs.j1038,
			source: "back_office",
			severity: "medium",
			status: "in_progress",
			submittedByName: "ICU service desk",
			submittedByContact: "uch.icu@example.com",
			description: "Mattress pressure alarm intermittently active.",
			createdAt: at("2026-05-24T10:00:00+08:00"),
		},
	]);

	await db.insert(partInventory).values([
		{
			tenantId: demoTenantId,
			partId: ids.parts.slingBar,
			locationName: "Main store",
			stockOnHand: 0,
			minimumStock: 2,
		},
		{
			tenantId: demoTenantId,
			partId: ids.parts.battery,
			locationName: "Main store",
			stockOnHand: 3,
			minimumStock: 4,
		},
		{
			tenantId: demoTenantId,
			partId: ids.parts.castor,
			locationName: "Main store",
			stockOnHand: 11,
			minimumStock: 6,
		},
	]);
	await db.insert(partsShortages).values([
		{
			tenantId: demoTenantId,
			shortageNumber: "S-801",
			jobId: ids.jobs.j1038,
			partId: ids.parts.slingBar,
			engineerId: ids.engineers.arun,
			quantityRequested: 1,
			status: "waiting_for_parts",
			notes: "Paused pending sling bar assembly.",
			reportedAt: at("2026-05-24T12:12:00+08:00"),
		},
		{
			tenantId: demoTenantId,
			shortageNumber: "S-798",
			jobId: ids.jobs.j1049,
			partId: ids.parts.battery,
			engineerId: ids.engineers.mandy,
			quantityRequested: 1,
			status: "reschedule_ready",
			notes: "Battery module arrived and ready for PM visit.",
			reportedAt: at("2026-05-24T15:00:00+08:00"),
			arrivedAt: at("2026-05-25T08:00:00+08:00"),
			confirmedByUserId: adminId,
		},
	]);

	await db.insert(jobPartsUsage).values([
		{
			tenantId: demoTenantId,
			jobId: ids.jobs.j1048,
			partId: ids.parts.slingBar,
			quantity: 1,
			unitCostHkd: "1580.00",
			coverageStatus: "out_of_contract",
			isBillable: true,
			usedAt: at("2026-05-25T11:20:00+08:00"),
		},
		{
			tenantId: demoTenantId,
			jobId: ids.jobs.j1032,
			partId: ids.parts.castor,
			quantity: 1,
			unitCostHkd: "180.00",
			coverageStatus: "in_contract",
			isBillable: false,
			usedAt: at("2026-05-24T16:10:00+08:00"),
		},
	]);
	await db.insert(jobExpenses).values([
		{
			id: ids.expenses.j1048Mileage,
			tenantId: demoTenantId,
			jobId: ids.jobs.j1048,
			engineerId: ids.engineers.kelvin,
			type: "mileage",
			quantity: "15.00",
			amountHkd: "72.00",
			notes: "15 km round trip.",
			loggedAt: at("2026-05-25T11:45:00+08:00"),
		},
		{
			id: ids.expenses.j1032Meal,
			tenantId: demoTenantId,
			jobId: ids.jobs.j1032,
			engineerId: ids.engineers.kelvin,
			type: "meal",
			quantity: "1.00",
			amountHkd: "85.00",
			notes: "Receipt required and capped by profile policy.",
			loggedAt: at("2026-05-24T16:50:00+08:00"),
		},
	]);
	await db.insert(jobCosts).values([
		{
			tenantId: demoTenantId,
			jobId: ids.jobs.j1048,
			labourMinutes: 87,
			labourRateHkd: "620.00",
			labourCostHkd: "899.00",
			mileageCostHkd: "72.00",
			mealCostHkd: "0.00",
			partsAbsorbedHkd: "0.00",
			partsBillableHkd: "1580.00",
			totalInternalCostHkd: "971.00",
			totalBillableHkd: "1580.00",
			calculatedAt: at("2026-05-25T11:45:00+08:00"),
		},
		{
			tenantId: demoTenantId,
			jobId: ids.jobs.j1032,
			labourMinutes: 64,
			labourRateHkd: "620.00",
			labourCostHkd: "661.00",
			mileageCostHkd: "54.00",
			mealCostHkd: "85.00",
			partsAbsorbedHkd: "180.00",
			partsBillableHkd: "0.00",
			totalInternalCostHkd: "980.00",
			totalBillableHkd: "0.00",
			calculatedAt: at("2026-05-24T16:34:00+08:00"),
		},
		{
			tenantId: demoTenantId,
			jobId: ids.jobs.j1038,
			labourMinutes: 42,
			labourRateHkd: "500.00",
			labourCostHkd: "350.00",
			mileageCostHkd: "42.00",
			mealCostHkd: "0.00",
			partsAbsorbedHkd: "0.00",
			partsBillableHkd: "0.00",
			totalInternalCostHkd: "392.00",
			totalBillableHkd: "0.00",
			calculatedAt: at("2026-05-24T11:42:00+08:00"),
		},
	]);

	await db.insert(serviceManuals).values([
		{
			id: ids.manuals.maxiMove,
			tenantId: demoTenantId,
			productModelId: ids.productModels.maxiMove,
			fileName: "maxi-move-service.pdf",
			storageKey: "demo/arjo-hk/manuals/maxi-move-service.pdf",
			fileUrl: "/demo/manuals/maxi-move-service.pdf",
			pageCount: 94,
			version: "1",
			status: "indexed",
			uploadedByUserId: adminId,
			uploadedAt: at("2026-05-01T10:00:00+08:00"),
		},
		{
			id: ids.manuals.saraFlex,
			tenantId: demoTenantId,
			productModelId: ids.productModels.saraFlex,
			fileName: "sara-flex-manual.pdf",
			storageKey: "demo/arjo-hk/manuals/sara-flex-manual.pdf",
			fileUrl: "/demo/manuals/sara-flex-manual.pdf",
			pageCount: 88,
			version: "1",
			status: "indexed",
			uploadedByUserId: adminId,
			uploadedAt: at("2026-05-01T10:05:00+08:00"),
		},
	]);
	await db.insert(serviceManualSections).values([
		{
			id: ids.manualSections.slingBar,
			tenantId: demoTenantId,
			manualId: ids.manuals.maxiMove,
			pageNumber: 42,
			sectionTitle: "Sling bar removal and replacement",
			content:
				"Lock the lift arm, remove the retaining clip, support the sling bar, then replace the pivot bolt before load testing.",
			metadata: { model: "Maxi Move Floor Lift" },
		},
		{
			id: ids.manualSections.safeWorkingLoad,
			tenantId: demoTenantId,
			manualId: ids.manuals.maxiMove,
			pageNumber: 9,
			sectionTitle: "Safe working load label verification",
			content:
				"The safe working load must match the model label and the site configuration before returning the lift to service.",
			metadata: { model: "Maxi Move Floor Lift" },
		},
		{
			id: ids.manualSections.batteryFault,
			tenantId: demoTenantId,
			manualId: ids.manuals.saraFlex,
			pageNumber: 67,
			sectionTitle: "Battery fault isolation",
			content:
				"Check charger output, inspect battery terminals, and run the battery health diagnostic from the service menu.",
			metadata: { model: "Sara Flex Standing Aid" },
		},
	]);
	await db.insert(manualQaQueries).values([
		{
			tenantId: demoTenantId,
			engineerId: ids.engineers.kelvin,
			assetId: ids.assets.maxiMove,
			jobId: ids.jobs.j1048,
			manualId: ids.manuals.maxiMove,
			question: "How do I replace the sling bar assembly?",
			topSectionIds: [
				ids.manualSections.slingBar,
				ids.manualSections.safeWorkingLoad,
			],
			answerSummary:
				"Review sling bar replacement and verify safe working load before return to service.",
			createdAt: at("2026-05-25T11:05:00+08:00"),
		},
	]);

	await db.insert(fileAttachments).values([
		{
			tenantId: demoTenantId,
			ownerType: "job_expense",
			ownerId: ids.expenses.j1032Meal,
			fileName: "meal-receipt-j1032.jpg",
			storageKey: "demo/arjo-hk/receipts/meal-receipt-j1032.jpg",
			fileUrl: "/demo/receipts/meal-receipt-j1032.jpg",
			mimeType: "image/jpeg",
			fileSizeBytes: 188_000,
			uploadedByUserId: adminId,
			createdAt: at("2026-05-24T16:50:00+08:00"),
		},
	]);

	await db.insert(systemParameters).values([
		{
			tenantId: demoTenantId,
			key: "mileage_rate_hkd_per_km",
			value: 4.8,
			valueType: "number",
			description: "Mileage rate per kilometre.",
			updatedByUserId: adminId,
		},
		{
			tenantId: demoTenantId,
			key: "meal_cap_hkd_per_day",
			value: 95,
			valueType: "number",
			description: "Default daily meal cap.",
			updatedByUserId: adminId,
		},
		{
			tenantId: demoTenantId,
			key: "pm_advance_window_days",
			value: 2,
			valueType: "number",
			description: "PM opportunity alert window.",
			updatedByUserId: adminId,
		},
		{
			tenantId: demoTenantId,
			key: "geofence_radius_meters",
			value: 200,
			valueType: "number",
			description: "Hospital geofence radius.",
			updatedByUserId: adminId,
		},
		{
			tenantId: demoTenantId,
			key: "geofence_alert_countdown_minutes",
			value: 5,
			valueType: "number",
			description: "Countdown before timer anomaly alert.",
			updatedByUserId: adminId,
		},
		{
			tenantId: demoTenantId,
			key: "contract_expiry_warning_days",
			value: 30,
			valueType: "number",
			description: "Days before expiry to warn Back Office.",
			updatedByUserId: adminId,
		},
		{
			tenantId: demoTenantId,
			key: "google_maps_api_key",
			value: "configured-server-side",
			valueType: "secret",
			description: "Google Maps API key reference.",
			updatedByUserId: adminId,
		},
	]);

	await db.insert(pushNotifications).values([
		{
			tenantId: demoTenantId,
			engineerId: ids.engineers.mandy,
			jobId: ids.jobs.j1049,
			type: "job_assigned",
			status: "sent",
			title: "New job assigned",
			body: "J-1049 at Prince of Wales Hospital has been assigned.",
			createdAt: at("2026-05-25T08:30:00+08:00"),
			sentAt: at("2026-05-25T08:30:10+08:00"),
		},
		{
			tenantId: demoTenantId,
			engineerId: ids.engineers.ivy,
			jobId: ids.jobs.j1041,
			type: "geofence_alert",
			status: "sent",
			title: "Still on site?",
			body: "Tap NFC to close the job or return to the hospital geofence.",
			createdAt: at("2026-05-25T09:56:00+08:00"),
			sentAt: at("2026-05-25T09:56:08+08:00"),
		},
	]);
	await db.insert(websocketEvents).values([
		{
			tenantId: demoTenantId,
			channel: "tenant:arjo-hk:back-office",
			eventType: "geofence.timer_anomaly",
			entityType: "job",
			entityId: ids.jobs.j1041,
			payload: { engineer: "Ivy Lee", job: "J-1041" },
			createdAt: at("2026-05-25T09:56:00+08:00"),
		},
	]);
	await db.insert(reportSnapshots).values([
		{
			tenantId: demoTenantId,
			period: "month",
			periodStart: "2026-05-01",
			periodEnd: "2026-05-31",
			metrics: {
				averageResolutionHours: 5.4,
				billablePartsHkd: 18_200,
				firstFixRate: 0.82,
				jobsCompleted: 128,
			},
			createdAt: at("2026-05-25T08:00:00+08:00"),
		},
	]);
}

async function main() {
	await resetDemoTenant();
	const adminId = await upsertDemoAdminUser();
	await seedReferenceData(adminId);

	console.log(`Seeded demo tenant ${demoTenantId} with admin ${adminEmail}`);
}

main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
