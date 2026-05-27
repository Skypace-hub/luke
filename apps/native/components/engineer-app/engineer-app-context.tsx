import type { PropsWithChildren } from "react";
import { createContext, useContext, useMemo, useState } from "react";

import {
	type EngineerJob,
	type ExpenseEntry,
	initialEngineerJobs,
	initialExpenses,
} from "@/lib/engineer-app-data";

type JobStage =
	| "list"
	| "detail"
	| "active"
	| "pause"
	| "submit-record"
	| "parts"
	| "complete";

type CheckDeviceStage = "scan" | "known" | "unknown" | "fault";
type AddDeviceStage = "list" | "commission" | "manual" | "success";
type ProfileStage =
	| "home"
	| "expenses"
	| "history"
	| "manuals"
	| "performance"
	| "settings";

interface EngineerAppContextValue {
	addDeviceStage: AddDeviceStage;
	addExpense: (entry: ExpenseEntry) => void;
	checkDeviceStage: CheckDeviceStage;
	completeSelectedJob: () => void;
	expenses: ExpenseEntry[];
	jobStage: JobStage;
	jobs: EngineerJob[];
	pauseSelectedJob: () => void;
	profileStage: ProfileStage;
	selectedJob: EngineerJob;
	selectedJobId: string;
	selectJob: (jobId: string, stage?: JobStage) => void;
	setAddDeviceStage: (stage: AddDeviceStage) => void;
	setCheckDeviceStage: (stage: CheckDeviceStage) => void;
	setJobStage: (stage: JobStage) => void;
	setProfileStage: (stage: ProfileStage) => void;
	startSelectedJob: () => void;
}

const EngineerAppContext = createContext<EngineerAppContextValue | undefined>(
	undefined
);

export function EngineerAppProvider({ children }: PropsWithChildren) {
	const [jobs, setJobs] = useState(initialEngineerJobs);
	const [selectedJobId, setSelectedJobId] = useState(initialEngineerJobs[0].id);
	const [jobStage, setJobStage] = useState<JobStage>("list");
	const [checkDeviceStage, setCheckDeviceStage] =
		useState<CheckDeviceStage>("scan");
	const [addDeviceStage, setAddDeviceStage] = useState<AddDeviceStage>("list");
	const [profileStage, setProfileStage] = useState<ProfileStage>("home");
	const [expenses, setExpenses] = useState(initialExpenses);

	const selectedJob = useMemo(
		() => jobs.find((job) => job.id === selectedJobId) ?? jobs[0],
		[jobs, selectedJobId]
	);

	const value = useMemo<EngineerAppContextValue>(() => {
		const updateSelectedStatus = (status: EngineerJob["status"]) => {
			setJobs((currentJobs) =>
				currentJobs.map((job) =>
					job.id === selectedJobId ? { ...job, status } : job
				)
			);
		};

		return {
			jobs,
			selectedJobId,
			selectedJob,
			jobStage,
			setJobStage,
			selectJob: (jobId: string, stage: JobStage = "detail") => {
				setSelectedJobId(jobId);
				setJobStage(stage);
			},
			startSelectedJob: () => {
				updateSelectedStatus("active");
				setJobStage("active");
			},
			pauseSelectedJob: () => {
				updateSelectedStatus("paused");
				setJobStage("list");
			},
			completeSelectedJob: () => {
				updateSelectedStatus("complete");
				setJobStage("complete");
			},
			checkDeviceStage,
			setCheckDeviceStage,
			addDeviceStage,
			setAddDeviceStage,
			profileStage,
			setProfileStage,
			expenses,
			addExpense: (entry: ExpenseEntry) => {
				setExpenses((currentExpenses) => [entry, ...currentExpenses]);
			},
		};
	}, [
		addDeviceStage,
		checkDeviceStage,
		expenses,
		jobStage,
		jobs,
		profileStage,
		selectedJob,
		selectedJobId,
	]);

	return (
		<EngineerAppContext.Provider value={value}>
			{children}
		</EngineerAppContext.Provider>
	);
}

export function useEngineerApp() {
	const context = useContext(EngineerAppContext);
	if (!context) {
		throw new Error("useEngineerApp must be used within EngineerAppProvider");
	}
	return context;
}
