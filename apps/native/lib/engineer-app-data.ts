import type { Ionicons } from "@expo/vector-icons";
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
	parts: EngineerPart[];
	reportedFault: string;
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
	category: string;
	history: ServiceEvent[];
	id: string;
	lastServiced: string;
	location: string;
	name: string;
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

export const engineerProfile = {
	name: "James Chen",
	initials: "JC",
	role: "Senior Engineer",
	region: "North Region",
	clockedInAt: "08:23",
	shiftDuration: "1h 18m",
	jobsThisMonth: "14",
	averageResolution: "2h 08m",
	firstFixRate: "91%",
};

export const commonParts: EngineerPart[] = [
	{
		id: "expiratory-valve",
		name: "Expiratory Valve Kit",
		partNumber: "8414562",
		status: "in-contract",
		defaultQuantity: 1,
	},
	{
		id: "flow-sensor",
		name: "Flow Sensor",
		partNumber: "8414891",
		status: "billable",
		defaultQuantity: 0,
	},
	{
		id: "o2-cell",
		name: "O2 Cell",
		partNumber: "8411203",
		status: "in-contract",
		defaultQuantity: 0,
	},
];

export const initialEngineerJobs: EngineerJob[] = [
	{
		id: "1042",
		type: "urgent",
		status: "assigned",
		title: "Ventilator Repair",
		site: "St. Mary's Hospital",
		location: "ICU Floor 3, Room 302",
		device: "Drager Evita 600",
		serial: "EVT-20892-B",
		reportedFault: "Alarm fault E-401",
		scheduledTime: "09:00",
		duration: "2h 14m",
		assetId: "asset-vent-600",
		parts: commonParts,
	},
	{
		id: "1045",
		type: "repair",
		status: "assigned",
		title: "Infusion Pump Service",
		site: "City General",
		location: "Ward 7, Bay 12",
		device: "Alaris GP Plus",
		serial: "ALR-7761-K",
		reportedFault: "Occlusion alarm repeat",
		scheduledTime: "13:00",
		duration: "1h 05m",
		assetId: "asset-pump-7761",
		parts: commonParts.slice(0, 2),
	},
	{
		id: "1048",
		type: "preventive-maintenance",
		status: "assigned",
		title: "MRI Scanner Annual",
		site: "North Clinic",
		location: "MRI Suite",
		device: "Magnetom Sola",
		serial: "MRI-3882-A",
		reportedFault: "Annual preventive maintenance",
		scheduledTime: "15:30",
		duration: "3h 40m",
		assetId: "asset-mri-3882",
		parts: commonParts.slice(1),
	},
];

export const installationJobs: EngineerJob[] = [
	{
		id: "1031",
		type: "installation",
		status: "assigned",
		title: "New Ventilator - ICU",
		site: "St. Mary's Hospital",
		location: "ICU Floor 3",
		device: "Drager Evita 600",
		serial: "Pending on install",
		reportedFault: "Asset pre-registered",
		scheduledTime: "11:00",
		duration: "1h 30m",
		assetId: "a3f2bc91-4e1d",
		parts: commonParts,
	},
	{
		id: "1036",
		type: "installation",
		status: "assigned",
		title: "Infusion Pump Install",
		site: "City General",
		location: "Ward 4",
		device: "Alaris GP Plus",
		serial: "Pending on install",
		reportedFault: "New ward deployment",
		scheduledTime: "16:00",
		duration: "1h 00m",
		assetId: "b5d91fa0-17c2",
		parts: commonParts.slice(0, 2),
	},
];

export const knownDevice: DeviceRecord = {
	id: "asset-vent-600",
	name: "Drager Evita 600",
	category: "Ventilator",
	site: "St. Mary's Hospital",
	location: "ICU Floor 3, Room 302",
	serial: "EVT-20892-B",
	status: "active",
	lastServiced: "12 Mar 2026",
	parts: commonParts,
	history: [
		{
			id: "service-1042",
			title: "Valve kit replacement",
			date: "08 May 2026",
			engineer: "James Chen",
			duration: "2h 14m",
		},
		{
			id: "service-998",
			title: "Annual preventive maintenance",
			date: "12 Mar 2026",
			engineer: "Sarah K.",
			duration: "3h 40m",
		},
	],
};

export const calendarDays: CalendarDay[] = [
	{ id: "blank-1", day: 0, hasJobs: false, jobIds: [] },
	{ id: "blank-2", day: 0, hasJobs: false, jobIds: [] },
	{ id: "blank-3", day: 0, hasJobs: false, jobIds: [] },
	{ id: "2026-05-01", day: 1, hasJobs: true, jobIds: ["1031"] },
	{ id: "2026-05-02", day: 2, hasJobs: true, jobIds: ["1045"] },
	{ id: "2026-05-03", day: 3, hasJobs: false, jobIds: [] },
	{ id: "2026-05-04", day: 4, hasJobs: false, jobIds: [] },
	{ id: "2026-05-05", day: 5, hasJobs: true, jobIds: ["1048"] },
	{ id: "2026-05-06", day: 6, hasJobs: true, jobIds: ["1045"] },
	{ id: "2026-05-07", day: 7, hasJobs: true, jobIds: ["1048"] },
	{
		id: "2026-05-08",
		day: 8,
		hasJobs: true,
		isToday: true,
		jobIds: ["1042", "1045", "1048"],
	},
	{ id: "2026-05-09", day: 9, hasJobs: false, jobIds: [] },
	{ id: "2026-05-10", day: 10, hasJobs: false, jobIds: [] },
	{ id: "2026-05-11", day: 11, hasJobs: false, jobIds: [] },
	{ id: "2026-05-12", day: 12, hasJobs: false, jobIds: [] },
	{ id: "2026-05-13", day: 13, hasJobs: true, jobIds: ["1036"] },
	{ id: "2026-05-14", day: 14, hasJobs: false, jobIds: [] },
	{ id: "2026-05-15", day: 15, hasJobs: true, jobIds: ["1042"] },
	{ id: "2026-05-16", day: 16, hasJobs: false, jobIds: [] },
	{ id: "2026-05-17", day: 17, hasJobs: false, jobIds: [] },
	{ id: "2026-05-18", day: 18, hasJobs: false, jobIds: [] },
	{ id: "2026-05-19", day: 19, hasJobs: false, jobIds: [] },
	{ id: "2026-05-20", day: 20, hasJobs: true, jobIds: ["1045"] },
	{ id: "2026-05-21", day: 21, hasJobs: false, jobIds: [] },
	{ id: "2026-05-22", day: 22, hasJobs: true, jobIds: ["1048"] },
	{ id: "2026-05-23", day: 23, hasJobs: true, jobIds: ["1042"] },
	{ id: "2026-05-24", day: 24, hasJobs: false, jobIds: [] },
	{ id: "2026-05-25", day: 25, hasJobs: false, jobIds: [] },
];

export const initialExpenses: ExpenseEntry[] = [
	{
		id: "mileage-47",
		category: "Mileage",
		detail: "47 km",
		value: "GBP 21.15",
		linkedJob: "Job #1042",
	},
	{
		id: "food-day",
		category: "Food",
		detail: "1 day",
		value: "GBP 15.00",
	},
];
