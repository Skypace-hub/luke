import type { Ionicons } from "@expo/vector-icons";
import type { ServiceOpsSnapshot } from "@luke/api/types/service-ops";
import type { ComponentProps } from "react";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export type JobType =
	| "urgent"
	| "repair"
	| "preventive-maintenance"
	| "installation";

export type JobStatus = "assigned" | "active" | "paused" | "complete";

export type PartStatus = "in-contract" | "billable";

export interface EngineerPart {
	defaultQuantity: number;
	id: string;
	name: string;
	partNumber: string;
	status: PartStatus;
}

export interface EngineerJob {
	assetId: string;
	device: string;
	duration: string;
	id: string;
	location: string;
	nfcUid: string;
	parts: EngineerPart[];
	recordId: string;
	reportedFault: string;
	scheduledDate: null | string;
	scheduledTime: string;
	serial: string;
	site: string;
	status: JobStatus;
	title: string;
	type: JobType;
}

export interface ServiceEvent {
	date: string;
	duration: string;
	engineer: string;
	id: string;
	title: string;
}

export interface DeviceRecord {
	assetId: string;
	category: string;
	history: ServiceEvent[];
	id: string;
	lastServiced: string;
	location: string;
	manualFileUrl: null | string;
	name: string;
	nfcUid: string;
	parts: EngineerPart[];
	serial: string;
	site: string;
	status: "active" | "unknown";
}

export interface CalendarDay {
	day: number;
	hasJobs: boolean;
	id: string;
	isToday?: boolean;
	jobIds: string[];
}

export interface ExpenseEntry {
	category: string;
	detail: string;
	id: string;
	linkedJob?: string;
	value: string;
}

export interface EngineerProfile {
	averageResolution: string;
	clockedInAt: string;
	firstFixRate: string;
	initials: string;
	jobsThisMonth: string;
	name: string;
	region: string;
	role: string;
	shiftDuration: string;
}

type SnapshotAsset = ServiceOpsSnapshot["assets"][number];
type SnapshotEngineer = ServiceOpsSnapshot["engineers"][number];
type SnapshotJob = ServiceOpsSnapshot["jobs"][number];
type SnapshotProduct = ServiceOpsSnapshot["products"][number];

const fallbackPartCount = 3;
const minutesPerHour = 60;
const calendarWeekLength = 7;
const durationHourRegex = /(\d+)h/;
const durationMinuteRegex = /(\d+)m/;

export const emptyEngineerProfile: EngineerProfile = {
	averageResolution: "0m",
	clockedInAt: "Not clocked in",
	firstFixRate: "0%",
	initials: "--",
	jobsThisMonth: "0",
	name: "No engineer profile",
	region: "No region",
	role: "Engineer",
	shiftDuration: "0m",
};

export const emptyDeviceRecord: DeviceRecord = {
	assetId: "",
	category: "Unknown",
	history: [],
	id: "unknown-device",
	lastServiced: "Not serviced",
	location: "Unknown location",
	manualFileUrl: null,
	name: "Unknown Device",
	nfcUid: "",
	parts: [],
	serial: "Unknown serial",
	site: "Unknown hospital",
	status: "unknown",
};

export const initialExpenses: ExpenseEntry[] = [];

export function getCurrentEngineer(
	snapshot: ServiceOpsSnapshot | undefined,
	userEmail?: null | string
): SnapshotEngineer | null {
	if (!snapshot || snapshot.engineers.length === 0) {
		return null;
	}

	const normalizedEmail = userEmail?.trim().toLowerCase();
	if (normalizedEmail) {
		const matchedEngineer = snapshot.engineers.find(
			(engineer) => engineer.email?.trim().toLowerCase() === normalizedEmail
		);
		if (matchedEngineer) {
			return matchedEngineer;
		}
	}

	const activeEngineer = snapshot.engineers.find(
		(engineer) => engineer.status !== "Off duty"
	);

	return activeEngineer ?? snapshot.engineers[0];
}

export function buildEngineerJobs(
	snapshot: ServiceOpsSnapshot | undefined,
	engineerId: null | string | undefined
): EngineerJob[] {
	if (!snapshot) {
		return [];
	}

	const jobs = engineerId
		? snapshot.jobs.filter((job) => job.engineerId === engineerId)
		: snapshot.jobs;

	return jobs.map((job) => mapSnapshotJob(snapshot, job));
}

export function buildInstallationJobs(jobs: EngineerJob[]): EngineerJob[] {
	return jobs.filter(
		(job) => job.type === "installation" && job.status !== "complete"
	);
}

export function buildKnownDevice(
	snapshot: ServiceOpsSnapshot | undefined,
	selectedJob: EngineerJob | undefined
): DeviceRecord {
	if (!snapshot) {
		return emptyDeviceRecord;
	}

	const asset = selectedJob
		? snapshot.assets.find((record) => record.id === selectedJob.assetId)
		: snapshot.assets[0];

	if (!asset) {
		return emptyDeviceRecord;
	}

	return mapAssetToDevice(snapshot, asset);
}

export function buildEngineerProfile(
	engineer: SnapshotEngineer | null,
	jobs: EngineerJob[]
): EngineerProfile {
	if (!engineer) {
		return emptyEngineerProfile;
	}

	const completedJobs = jobs.filter((job) => job.status === "complete");
	const completedDurations = completedJobs
		.map((job) => durationToMinutes(job.duration))
		.filter((duration) => duration > 0);
	const averageMinutes = completedDurations.length
		? Math.round(
				completedDurations.reduce((total, duration) => total + duration, 0) /
					completedDurations.length
			)
		: 0;
	const firstFixRate = jobs.length
		? Math.round((completedJobs.length / jobs.length) * 100)
		: 0;

	return {
		averageResolution: formatDuration(averageMinutes),
		clockedInAt: engineer.status === "Off duty" ? "Off duty" : "Active now",
		firstFixRate: `${firstFixRate}%`,
		initials: getInitials(engineer.name),
		jobsThisMonth: String(jobs.length),
		name: engineer.name,
		region: engineer.region,
		role: engineer.grade,
		shiftDuration: engineer.status === "Off duty" ? "0m" : "Live",
	};
}

export function buildCalendarDays(jobs: EngineerJob[]): CalendarDay[] {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const firstDay = new Date(year, month, 1).getDay();
	const mondayOffset = (firstDay + 6) % calendarWeekLength;
	const days: CalendarDay[] = [];

	for (let index = 0; index < mondayOffset; index += 1) {
		days.push({ day: 0, hasJobs: false, id: `blank-${index}`, jobIds: [] });
	}

	for (let day = 1; day <= daysInMonth; day += 1) {
		const date = new Date(year, month, day);
		const id = toDateKey(date);
		const dayJobs = jobs.filter((job) => job.scheduledDate === id);
		days.push({
			day,
			hasJobs: dayJobs.length > 0,
			id,
			isToday: id === toDateKey(now),
			jobIds: dayJobs.map((job) => job.id),
		});
	}

	return days;
}

export function getCalendarMonthLabel() {
	const now = new Date();
	return `${new Intl.DateTimeFormat("en-HK", {
		month: "long",
		timeZone: "Asia/Hong_Kong",
	}).format(now)} ${now.getFullYear()}`;
}

function mapSnapshotJob(
	snapshot: ServiceOpsSnapshot,
	job: SnapshotJob
): EngineerJob {
	const asset = snapshot.assets.find((record) => record.id === job.assetId);
	const product = asset
		? snapshot.products.find((record) => record.id === asset.productModelId)
		: undefined;
	const parts = product ? buildPartsForProduct(snapshot, product, asset) : [];
	const scheduledDate = getScheduledDateKey(job.scheduledStartAt);
	const fallbackTitle = `${job.type} ${asset?.model ?? job.asset}`;

	return {
		assetId: job.assetId,
		device: asset?.model ?? job.asset,
		duration: formatDuration(job.timerMinutes),
		id: job.id,
		location: asset?.location ?? "No location",
		nfcUid: job.nfcUid,
		parts,
		recordId: job.recordId,
		reportedFault: job.description,
		scheduledDate,
		scheduledTime: getScheduledTime(job.scheduledStartAt, job.scheduledFor),
		serial: asset?.serial ?? "No serial",
		site: job.hospital,
		status: mapJobStatus(job.statusValue),
		title: job.description || fallbackTitle,
		type: mapJobType(job),
	};
}

function mapAssetToDevice(
	snapshot: ServiceOpsSnapshot,
	asset: SnapshotAsset
): DeviceRecord {
	const product = snapshot.products.find(
		(record) => record.id === asset.productModelId
	);
	const parts = product ? buildPartsForProduct(snapshot, product, asset) : [];
	const history = snapshot.jobs
		.filter(
			(job) => job.assetId === asset.id && job.statusValue === "completed"
		)
		.map((job) => ({
			date: job.scheduledFor,
			duration: formatDuration(job.timerMinutes),
			engineer: job.engineer,
			id: job.recordId,
			title: job.description,
		}));

	return {
		assetId: asset.recordId,
		category: product?.category ?? "Device",
		history,
		id: asset.id,
		lastServiced: history[0]?.date ?? "Not serviced",
		location: asset.location,
		manualFileUrl: product?.manualFileUrl ?? null,
		name: asset.model,
		nfcUid: asset.nfcUid,
		parts,
		serial: asset.serial,
		site: asset.hospital,
		status: asset.isActive ? "active" : "unknown",
	};
}

function buildPartsForProduct(
	snapshot: ServiceOpsSnapshot,
	product: SnapshotProduct,
	asset: SnapshotAsset | undefined
): EngineerPart[] {
	const matchedParts = snapshot.parts.filter((part) =>
		part.productModelIds.includes(product.id)
	);
	const sourceParts = matchedParts.length
		? matchedParts
		: snapshot.parts.slice(0, fallbackPartCount);

	return sourceParts.map((part) => ({
		defaultQuantity: 0,
		id: part.recordId,
		name: part.name,
		partNumber: part.id,
		status:
			asset?.contractCoverageValue === "in_contract"
				? "in-contract"
				: "billable",
	}));
}

function mapJobStatus(status: string): JobStatus {
	if (status === "in_progress" || status === "resumed") {
		return "active";
	}
	if (status === "paused" || status === "timer_anomaly") {
		return "paused";
	}
	if (status === "completed") {
		return "complete";
	}
	return "assigned";
}

function mapJobType(job: SnapshotJob): JobType {
	if (job.priorityValue === "urgent") {
		return "urgent";
	}
	if (job.typeValue === "preventive_maintenance") {
		return "preventive-maintenance";
	}
	if (job.typeValue === "installation") {
		return "installation";
	}
	return "repair";
}

function getScheduledDateKey(value: null | string): null | string {
	if (!value) {
		return null;
	}
	return toDateKey(new Date(value));
}

function getScheduledTime(value: null | string, fallback: string): string {
	if (!value) {
		return fallback;
	}
	return new Intl.DateTimeFormat("en-HK", {
		hour: "2-digit",
		hour12: false,
		minute: "2-digit",
		timeZone: "Asia/Hong_Kong",
	}).format(new Date(value));
}

function toDateKey(value: Date): string {
	const year = value.getFullYear();
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function durationToMinutes(value: string): number {
	const hourMatch = durationHourRegex.exec(value);
	const minuteMatch = durationMinuteRegex.exec(value);
	const hours = hourMatch ? Number.parseInt(hourMatch[1], 10) : 0;
	const minutes = minuteMatch ? Number.parseInt(minuteMatch[1], 10) : 0;
	return hours * minutesPerHour + minutes;
}

function formatDuration(minutes: number): string {
	if (minutes <= 0) {
		return "0m";
	}

	const hours = Math.floor(minutes / minutesPerHour);
	const remainingMinutes = minutes % minutesPerHour;

	if (hours === 0) {
		return `${remainingMinutes}m`;
	}

	return `${hours}h ${String(remainingMinutes).padStart(2, "0")}m`;
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
}
