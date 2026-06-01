import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

import { authClient } from "@/lib/auth-client";
import {
	buildCalendarDays,
	buildEngineerJobs,
	buildEngineerProfile,
	buildInstallationJobs,
	buildKnownDevice,
	type CalendarDay,
	type DeviceRecord,
	type EngineerJob,
	type EngineerProfile,
	type ExpenseEntry,
	getCalendarMonthLabel,
	getCurrentEngineer,
	initialExpenses,
} from "@/lib/engineer-app-data";
import { trpc } from "@/utils/trpc";

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

type ExpenseCategory = "Accommodation" | "Food" | "Mileage" | "Other";

interface ExpenseSubmission {
	amount: number;
	category: ExpenseCategory;
	distance: number;
}

interface EngineerAppContextValue {
	addDeviceStage: AddDeviceStage;
	addExpense: (entry: ExpenseEntry) => void;
	calendarDays: CalendarDay[];
	calendarMonthLabel: string;
	checkDeviceStage: CheckDeviceStage;
	clockOut: () => Promise<void>;
	commissionSelectedInstallationTag: () => Promise<void>;
	completeSelectedJob: (
		partQuantities?: Record<string, number>
	) => Promise<void>;
	currentDevice: DeviceRecord;
	currentEngineerId: null | string;
	expenses: ExpenseEntry[];
	installationJobs: EngineerJob[];
	isActionPending: boolean;
	isLoading: boolean;
	jobStage: JobStage;
	jobs: EngineerJob[];
	lastError: null | string;
	pauseSelectedJob: (input?: {
		notes?: string;
		partIds?: string[];
	}) => Promise<void>;
	profile: EngineerProfile;
	profileStage: ProfileStage;
	refresh: () => Promise<void>;
	selectedJob: EngineerJob;
	selectedJobId: string;
	selectInstallationJob: (jobId: string) => void;
	selectJob: (jobId: string, stage?: JobStage) => void;
	setAddDeviceStage: (stage: AddDeviceStage) => void;
	setCheckDeviceStage: (stage: CheckDeviceStage) => void;
	setJobStage: (stage: JobStage) => void;
	setProfileStage: (stage: ProfileStage) => void;
	startSelectedJob: () => Promise<void>;
	submitExpense: (input: ExpenseSubmission) => Promise<void>;
}

const EngineerAppContext = createContext<EngineerAppContextValue | undefined>(
	undefined
);

const fallbackJob: EngineerJob = {
	assetId: "",
	device: "No device",
	duration: "0m",
	id: "--",
	location: "No location",
	nfcUid: "",
	parts: [],
	recordId: "",
	reportedFault: "No assigned job",
	scheduledDate: null,
	scheduledTime: "Not scheduled",
	serial: "No serial",
	site: "No hospital",
	status: "assigned",
	title: "No assigned job",
	type: "repair",
};

export function EngineerAppProvider({ children }: PropsWithChildren) {
	const queryClient = useQueryClient();
	const sessionQuery = authClient.useSession();
	const userEmail = sessionQuery.data?.user.email;
	const snapshotQuery = useQuery(
		trpc.serviceOps.snapshot.queryOptions(undefined, {
			refetchInterval: 15_000,
			staleTime: 10_000,
		})
	);
	const snapshot = snapshotQuery.data;
	const currentEngineer = useMemo(
		() => getCurrentEngineer(snapshot, userEmail),
		[snapshot, userEmail]
	);
	const jobs = useMemo(
		() => buildEngineerJobs(snapshot, currentEngineer?.id),
		[snapshot, currentEngineer?.id]
	);
	const installationJobs = useMemo(() => buildInstallationJobs(jobs), [jobs]);
	const calendarDays = useMemo(() => buildCalendarDays(jobs), [jobs]);
	const profile = useMemo(
		() => buildEngineerProfile(currentEngineer, jobs),
		[currentEngineer, jobs]
	);
	const [selectedJobId, setSelectedJobId] = useState("");
	const [jobStage, setJobStage] = useState<JobStage>("list");
	const [checkDeviceStage, setCheckDeviceStage] =
		useState<CheckDeviceStage>("scan");
	const [addDeviceStage, setAddDeviceStage] = useState<AddDeviceStage>("list");
	const [profileStage, setProfileStage] = useState<ProfileStage>("home");
	const [expenses, setExpenses] = useState(initialExpenses);
	const [lastError, setLastError] = useState<null | string>(null);
	const selectedJob =
		jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? fallbackJob;
	const currentDevice = useMemo(
		() =>
			buildKnownDevice(
				snapshot,
				selectedJob.recordId ? selectedJob : undefined
			),
		[snapshot, selectedJob]
	);
	const snapshotFilter = snapshot?.tenant.id
		? trpc.serviceOps.snapshot.queryFilter({ tenantId: snapshot.tenant.id })
		: trpc.serviceOps.snapshot.queryFilter();
	const mutationOptions = {
		onError(error: unknown) {
			setLastError(getErrorMessage(error));
		},
		onSuccess: async () => {
			setLastError(null);
			await queryClient.invalidateQueries(snapshotFilter);
		},
	};
	const startJobMutation = useMutation(
		trpc.serviceOps.startJobWithNfc.mutationOptions(mutationOptions)
	);
	const endJobMutation = useMutation(
		trpc.serviceOps.endJobWithNfc.mutationOptions(mutationOptions)
	);
	const reportShortageMutation = useMutation(
		trpc.serviceOps.reportPartsShortage.mutationOptions(mutationOptions)
	);
	const addPartUsageMutation = useMutation(
		trpc.serviceOps.addJobPartUsage.mutationOptions(mutationOptions)
	);
	const logExpenseMutation = useMutation(
		trpc.serviceOps.logJobExpense.mutationOptions(mutationOptions)
	);
	const clockEngineerMutation = useMutation(
		trpc.serviceOps.clockEngineer.mutationOptions(mutationOptions)
	);
	const commissionTagMutation = useMutation(
		trpc.serviceOps.commissionAssetNfcTag.mutationOptions(mutationOptions)
	);
	const isActionPending =
		startJobMutation.isPending ||
		endJobMutation.isPending ||
		reportShortageMutation.isPending ||
		addPartUsageMutation.isPending ||
		logExpenseMutation.isPending ||
		clockEngineerMutation.isPending ||
		commissionTagMutation.isPending;

	const ensureTenantId = useCallback(() => {
		if (!snapshot?.tenant.id) {
			throw new Error("Tenant is not loaded");
		}
		return snapshot.tenant.id;
	}, [snapshot?.tenant.id]);

	const ensureSelectedJob = useCallback(() => {
		if (!selectedJob.recordId) {
			throw new Error("Select a job first");
		}
		return selectedJob;
	}, [selectedJob]);

	const value = useMemo<EngineerAppContextValue>(() => {
		const addExpense = (entry: ExpenseEntry) => {
			setExpenses((currentExpenses) => [entry, ...currentExpenses]);
		};

		const runAction = async (action: () => Promise<void>) => {
			try {
				await action();
			} catch (error) {
				setLastError(
					error instanceof Error ? error.message : "Request failed."
				);
			}
		};

		return {
			addDeviceStage,
			addExpense,
			calendarDays,
			calendarMonthLabel: getCalendarMonthLabel(),
			checkDeviceStage,
			clockOut: async () => {
				await runAction(async () => {
					if (!currentEngineer?.id) {
						throw new Error("Engineer profile is not loaded");
					}
					await clockEngineerMutation.mutateAsync({
						id: currentEngineer.id,
						tenantId: ensureTenantId(),
						data: { eventType: "clock_out" },
					});
				});
			},
			commissionSelectedInstallationTag: async () => {
				await runAction(async () => {
					const job = ensureSelectedJob();
					await commissionTagMutation.mutateAsync({
						id: job.assetId,
						tenantId: ensureTenantId(),
						data: {
							engineerId: currentEngineer?.id ?? null,
							nfcUid: job.nfcUid,
						},
					});
					setAddDeviceStage("success");
				});
			},
			completeSelectedJob: async (partQuantities = {}) => {
				await runAction(async () => {
					const job = ensureSelectedJob();
					const tenantId = ensureTenantId();
					const partEntries = Object.entries(partQuantities).filter(
						([, quantity]) => quantity > 0
					);

					for (const [partId, quantity] of partEntries) {
						await addPartUsageMutation.mutateAsync({
							id: job.recordId,
							tenantId,
							data: { partId, quantity },
						});
					}

					await endJobMutation.mutateAsync({
						id: job.recordId,
						tenantId,
						data: {
							nfcUid: job.nfcUid,
							notes: "Completed from engineer app",
						},
					});
					setJobStage("complete");
				});
			},
			currentDevice,
			currentEngineerId: currentEngineer?.id ?? null,
			expenses,
			installationJobs,
			isActionPending,
			isLoading: snapshotQuery.isLoading || sessionQuery.isPending,
			jobStage,
			jobs,
			lastError: lastError ?? snapshotQuery.error?.message ?? null,
			pauseSelectedJob: async ({ notes, partIds } = {}) => {
				await runAction(async () => {
					const job = ensureSelectedJob();
					const missingPartId = partIds?.[0] ?? job.parts[0]?.id;
					if (!missingPartId) {
						throw new Error("Select a missing part first");
					}
					await reportShortageMutation.mutateAsync({
						id: job.recordId,
						tenantId: ensureTenantId(),
						data: {
							notes: notes || "Paused from engineer app",
							partId: missingPartId,
							quantityRequested: 1,
						},
					});
					setJobStage("list");
				});
			},
			profile,
			profileStage,
			refresh: async () => {
				await snapshotQuery.refetch();
			},
			selectedJob,
			selectedJobId,
			selectInstallationJob: (jobId: string) => {
				setSelectedJobId(jobId);
				setAddDeviceStage("commission");
			},
			selectJob: (jobId: string, stage: JobStage = "detail") => {
				setSelectedJobId(jobId);
				setJobStage(stage);
			},
			setAddDeviceStage,
			setCheckDeviceStage,
			setJobStage,
			setProfileStage,
			startSelectedJob: async () => {
				await runAction(async () => {
					const job = ensureSelectedJob();
					await startJobMutation.mutateAsync({
						id: job.recordId,
						tenantId: ensureTenantId(),
						data: {
							nfcUid: job.nfcUid,
							notes: "Started from engineer app",
						},
					});
					setJobStage("active");
				});
			},
			submitExpense: async ({ amount, category, distance }) => {
				await runAction(async () => {
					const job = ensureSelectedJob();
					const type = getExpenseType(category);
					await logExpenseMutation.mutateAsync({
						id: job.recordId,
						tenantId: ensureTenantId(),
						data: {
							amount: type === "mileage" ? null : amount,
							notes: `Submitted from engineer app: ${category}`,
							quantity: type === "mileage" ? distance : null,
							type,
						},
					});
					addExpense({
						category,
						detail: type === "mileage" ? `${distance} km` : "1 item",
						id: `expense-${Date.now()}`,
						linkedJob: `Job #${job.id}`,
						value: `HKD ${amount.toFixed(2)}`,
					});
				});
			},
		};
	}, [
		addDeviceStage,
		addPartUsageMutation,
		calendarDays,
		checkDeviceStage,
		clockEngineerMutation,
		commissionTagMutation,
		currentDevice,
		currentEngineer?.id,
		endJobMutation,
		ensureSelectedJob,
		ensureTenantId,
		expenses,
		installationJobs,
		isActionPending,
		jobStage,
		jobs,
		lastError,
		logExpenseMutation,
		profile,
		profileStage,
		reportShortageMutation,
		selectedJob,
		selectedJobId,
		sessionQuery.isPending,
		snapshotQuery,
		startJobMutation,
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

function getExpenseType(category: ExpenseCategory) {
	if (category === "Mileage") {
		return "mileage" as const;
	}
	if (category === "Food") {
		return "meal" as const;
	}
	if (category === "Accommodation") {
		return "other" as const;
	}
	return "parking" as const;
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "object" && error !== null) {
		const maybeError = error as { message?: unknown };
		if (typeof maybeError.message === "string") {
			return maybeError.message;
		}
	}
	return "Request failed.";
}
