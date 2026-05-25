"use client";

import { Button } from "@luke/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@luke/ui/components/card";
import { Input } from "@luke/ui/components/input";
import { Label } from "@luke/ui/components/label";
import {
	ActivityIcon,
	ArrowRightIcon,
	BellRingIcon,
	CheckCircle2Icon,
	ClipboardCheckIcon,
	ClockIcon,
	FileQuestionIcon,
	HospitalIcon,
	LocateFixedIcon,
	MessageSquareTextIcon,
	NfcIcon,
	PauseCircleIcon,
	PlayCircleIcon,
	PlusIcon,
	ReceiptTextIcon,
	SearchIcon,
	ShieldCheckIcon,
	SmartphoneIcon,
	UploadIcon,
	UsersIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import {
	assets,
	type BackOfficeView,
	type ContractStatus,
	contracts,
	type EngineerStatus,
	engineers,
	type FaultStatus,
	faultReports,
	hospitals,
	type Job,
	type JobStatus,
	jobs,
	liveAlerts,
	type ManualAnswer,
	manualAnswers,
	navigationItems,
	parts,
	reportMetrics,
	serviceStateMachine,
	shortages,
	systemParameters,
	tenant,
} from "@/lib/arjo-data";

type AppMode = "back-office" | "engineer" | "hospital";

type JobAction = "start" | "pause" | "resume" | "complete";

interface TableRow {
	cells: ReactNode[];
	id: string;
}

const statusStyles: Record<JobStatus, string> = {
	Assigned: "border-sky-200 bg-sky-50 text-sky-700",
	Cancelled: "border-zinc-200 bg-zinc-50 text-zinc-600",
	Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
	Created: "border-zinc-200 bg-zinc-50 text-zinc-700",
	"In Progress": "border-blue-200 bg-blue-50 text-blue-700",
	Paused: "border-amber-200 bg-amber-50 text-amber-700",
	"Timer Anomaly": "border-rose-200 bg-rose-50 text-rose-700",
};

const engineerStatusStyles: Record<EngineerStatus, string> = {
	Idle: "bg-amber-500",
	"In transit": "bg-sky-500",
	"Off duty": "bg-zinc-400",
	"On-site": "bg-emerald-500",
	"Timer anomaly": "bg-rose-500",
};

const contractStatusStyles: Record<ContractStatus, string> = {
	Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
	Expired: "border-zinc-200 bg-zinc-50 text-zinc-600",
	Expiring: "border-amber-200 bg-amber-50 text-amber-700",
};

const faultStatusStyles: Record<FaultStatus, string> = {
	"Engineer Assigned": "border-sky-200 bg-sky-50 text-sky-700",
	"In Progress": "border-blue-200 bg-blue-50 text-blue-700",
	Received: "border-amber-200 bg-amber-50 text-amber-700",
	Resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const dashboardStats = [
	{
		id: "open-jobs",
		label: "Open jobs",
		value: "11",
		meta: "4 urgent, 1 anomaly",
	},
	{
		id: "engineers",
		label: "Active engineers",
		value: "3/4",
		meta: "GPS updates every 2 min",
	},
	{
		id: "faults",
		label: "Fault reports",
		value: "7",
		meta: "2 high or critical",
	},
	{
		id: "contracts",
		label: "Contract warnings",
		value: "2",
		meta: "30-day warning window",
	},
];

const workflowCards = [
	{
		id: "job",
		title: "Job state machine",
		icon: ClipboardCheckIcon,
		detail:
			"Created -> Assigned -> In Progress -> Completed, with paused and anomaly branches.",
	},
	{
		id: "nfc",
		title: "NFC validation",
		icon: NfcIcon,
		detail:
			"Tag uid must match the assigned asset before timer and geofence can start.",
	},
	{
		id: "cost",
		title: "Server-computed cost",
		icon: ReceiptTextIcon,
		detail:
			"Labour, mileage, meal cap and parts billing flags are never accepted from clients.",
	},
	{
		id: "manual",
		title: "Manual Q&A beta",
		icon: FileQuestionIcon,
		detail:
			"Engineers receive top manual sections with page numbers after scanning a device.",
	},
];

const primaryActionClass =
	"border-[#0f766e] bg-[#0f766e] text-white shadow-sm hover:bg-[#0b5f58]";

const panelClass =
	"border border-[#d8dee8] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]";

const mutedPanelClass = "border border-[#d8dee8] bg-[#f8fafc]";

const getFirstItem = <T,>(items: T[], label: string): T => {
	const [firstItem] = items;

	if (!firstItem) {
		throw new Error(`${label} seed data is required`);
	}

	return firstItem;
};

const backOfficeTitles: Record<BackOfficeView, string> = {
	assets: "Installed Assets",
	config: "System Config",
	contracts: "Contracts",
	dashboard: "Dashboard",
	engineers: "Engineers",
	faults: "Faults",
	hospitals: "Hospitals",
	jobs: "Jobs",
	map: "Map",
	parts: "Parts & Stock",
	products: "Product Catalogue",
	reports: "Reports",
};

const getBackOfficeTitle = (view: BackOfficeView) => backOfficeTitles[view];

const getHashBackOfficeView = (): BackOfficeView | null => {
	if (typeof window === "undefined") {
		return null;
	}

	const hashView = window.location.hash.replace("#", "");
	const navigationItem = navigationItems.find((item) => item.id === hashView);

	return navigationItem?.id ?? null;
};

export default function ArjoPlatform() {
	const [mode, setMode] = useState<AppMode>("back-office");
	const [activeView, setActiveView] = useState<BackOfficeView>("dashboard");
	const firstJob = getFirstItem(jobs, "Job");
	const firstAsset = getFirstItem(assets, "Asset");
	const [selectedJobId, setSelectedJobId] = useState(firstJob.id);
	const [jobRuntimeStatus, setJobRuntimeStatus] =
		useState<JobStatus>("Assigned");
	const [faultStatus, setFaultStatus] = useState<FaultStatus>("Received");
	const [manualQuery, setManualQuery] = useState(
		"How do I replace the sling bar assembly?"
	);

	const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? firstJob;
	const selectedAsset =
		assets.find((asset) => asset.id === selectedJob.asset) ?? firstAsset;
	const selectedEngineer = engineers.find(
		(engineer) => engineer.name === selectedJob?.engineer
	);

	const filteredManualAnswers = useMemo(() => {
		const normalizedQuery = manualQuery.toLowerCase();

		if (!normalizedQuery.trim()) {
			return manualAnswers;
		}

		return manualAnswers.filter((answer) => {
			const [firstTerm] = normalizedQuery.split(" ");

			return `${answer.title} ${answer.excerpt}`
				.toLowerCase()
				.includes(firstTerm ?? "");
		});
	}, [manualQuery]);

	useEffect(() => {
		const syncViewFromUrl = () => {
			const hashView = getHashBackOfficeView();

			setActiveView(hashView ?? "dashboard");
		};

		syncViewFromUrl();
		window.addEventListener("hashchange", syncViewFromUrl);
		window.addEventListener("popstate", syncViewFromUrl);

		return () => {
			window.removeEventListener("hashchange", syncViewFromUrl);
			window.removeEventListener("popstate", syncViewFromUrl);
		};
	}, []);

	const applyJobAction = (action: JobAction) => {
		const nextStatusByAction: Record<JobAction, JobStatus> = {
			complete: "Completed",
			pause: "Paused",
			resume: "In Progress",
			start: "In Progress",
		};

		setJobRuntimeStatus(nextStatusByAction[action]);
	};

	const selectBackOfficeView = (view: BackOfficeView) => {
		setActiveView(view);

		const nextUrl = `${window.location.pathname}${window.location.search}#${view}`;

		if (window.location.href !== new URL(nextUrl, window.location.href).href) {
			window.history.pushState({ backOfficeView: view }, "", nextUrl);
		}

		if (window.matchMedia("(max-width: 1023px)").matches) {
			window.requestAnimationFrame(() => {
				document
					.getElementById("back-office-content")
					?.scrollIntoView({ behavior: "smooth", block: "start" });
			});
		}
	};

	return (
		<main className="min-h-svh bg-[#eef2f6] text-[#1f2937]">
			<div className="min-h-svh">
				{mode === "back-office" ? (
					<div className="grid min-h-svh lg:grid-cols-[256px_1fr]">
						<aside className="flex min-h-svh flex-col border-[#202a3b] border-r bg-[#111827] text-white">
							<div className="flex h-[68px] items-center gap-3 border-white/10 border-b px-5">
								<div className="flex size-9 items-center justify-center rounded-sm bg-[#0f766e] font-semibold text-white shadow-sm">
									U
								</div>
								<div>
									<p className="font-semibold text-base">Utiliti</p>
									<p className="text-[11px] text-white/45 uppercase tracking-[0.12em]">
										{tenant.name}
									</p>
								</div>
							</div>
							<nav className="flex flex-col gap-1 p-3">
								{navigationItems.map((item) => {
									const Icon = item.icon;

									return (
										<button
											aria-current={activeView === item.id ? "page" : undefined}
											className={`flex h-9 w-full cursor-pointer items-center gap-3 rounded-sm px-3 text-left text-[13px] transition ${
												activeView === item.id
													? "bg-[#0f766e] text-white shadow-sm"
													: "text-white/58 hover:bg-white/8 hover:text-white"
											}`}
											key={item.id}
											onClick={() => selectBackOfficeView(item.id)}
											type="button"
										>
											<Icon className="size-3.5" />
											{item.label}
										</button>
									);
								})}
							</nav>
							<div className="mt-auto border-white/10 border-t p-4">
								<div className="flex items-center gap-3 rounded-sm bg-white/6 p-2">
									<div className="flex size-8 items-center justify-center rounded-sm bg-white/95 font-semibold text-[#111827] text-xs">
										AU
									</div>
									<div>
										<p className="font-medium text-[13px]">Admin User</p>
										<p className="text-[11px] text-white/45">admin</p>
									</div>
								</div>
							</div>
						</aside>
						<div className="min-w-0">
							<header className="flex min-h-[68px] flex-col gap-3 border-[#d8dee8] border-b bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
								<div>
									<h1 className="font-semibold text-lg tracking-tight">
										{getBackOfficeTitle(activeView)}
									</h1>
									<p className="mt-0.5 text-[#64748b] text-xs">
										{tenant.release} · {tenant.region} service operations
									</p>
								</div>
								<SurfaceSwitcher mode={mode} setMode={setMode} />
							</header>
							<section
								className="min-w-0 px-4 py-5 lg:px-6"
								id="back-office-content"
							>
								<BackOfficeViewPanel
									activeView={activeView}
									selectedJob={selectedJob}
									selectedJobId={selectedJobId}
									setSelectedJobId={setSelectedJobId}
								/>
							</section>
						</div>
					</div>
				) : (
					<>
						<header className="border-[#d8dee8] border-b bg-white">
							<div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-sm bg-[#0f766e] text-white">
										<ActivityIcon className="size-5" />
									</div>
									<div>
										<p className="text-[#64748b] text-xs uppercase tracking-[0.16em]">
											{tenant.release}
										</p>
										<h1 className="font-semibold text-xl">
											{tenant.name} Service Operations
										</h1>
									</div>
								</div>
								<SurfaceSwitcher mode={mode} setMode={setMode} />
							</div>
						</header>
						{mode === "engineer" ? (
							<EngineerWorkspace
								jobRuntimeStatus={jobRuntimeStatus}
								manualAnswers={filteredManualAnswers}
								manualQuery={manualQuery}
								onJobAction={applyJobAction}
								selectedAsset={selectedAsset}
								selectedEngineer={selectedEngineer?.name ?? "Engineer"}
								selectedJob={selectedJob}
								setManualQuery={setManualQuery}
							/>
						) : null}

						{mode === "hospital" ? (
							<HospitalFaultPortal
								faultStatus={faultStatus}
								setFaultStatus={setFaultStatus}
							/>
						) : null}
					</>
				)}
			</div>
		</main>
	);
}

function SurfaceSwitcher({
	mode,
	setMode,
}: {
	mode: AppMode;
	setMode: (mode: AppMode) => void;
}) {
	return (
		<div className="flex flex-wrap gap-1.5 rounded-sm border border-[#d8dee8] bg-[#f8fafc] p-1">
			<ModeButton
				active={mode === "back-office"}
				onClick={() => setMode("back-office")}
			>
				<UsersIcon className="size-4" />
				Back Office
			</ModeButton>
			<ModeButton
				active={mode === "engineer"}
				onClick={() => setMode("engineer")}
			>
				<SmartphoneIcon className="size-4" />
				Engineer App
			</ModeButton>
			<ModeButton
				active={mode === "hospital"}
				onClick={() => setMode("hospital")}
			>
				<HospitalIcon className="size-4" />
				Hospital Web
			</ModeButton>
		</div>
	);
}

function ModeButton({
	active,
	children,
	onClick,
}: {
	active: boolean;
	children: ReactNode;
	onClick: () => void;
}) {
	return (
		<button
			className={`inline-flex h-7 items-center gap-1.5 rounded-sm border px-2.5 text-xs transition ${
				active
					? "border-white bg-white text-[#111827] shadow-sm"
					: "border-transparent bg-transparent text-[#64748b] hover:bg-white/70 hover:text-[#111827]"
			}`}
			onClick={onClick}
			type="button"
		>
			{children}
		</button>
	);
}

function BackOfficeViewPanel({
	activeView,
	selectedJob,
	selectedJobId,
	setSelectedJobId,
}: {
	activeView: BackOfficeView;
	selectedJob?: Job;
	selectedJobId: string;
	setSelectedJobId: (jobId: string) => void;
}) {
	if (activeView === "jobs") {
		return (
			<PageFrame
				action={
					<Button className={primaryActionClass}>
						<PlusIcon className="size-4" />
						New job
					</Button>
				}
				eyebrow="A. Job Management"
				title="Job dispatch and state control"
			>
				<div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
					<div className="space-y-4">
						<FilterBar
							fields={[
								"Search jobs...",
								"All statuses",
								"All job types",
								"All engineers",
							]}
						/>
						<DataTable
							columns={[
								"Job",
								"Type",
								"Status",
								"Priority",
								"Engineer",
								"Schedule",
							]}
							rows={jobs.map((job) => ({
								cells: [
									<button
										className="font-medium text-[#0f766e] hover:underline"
										key={`${job.id}-button`}
										onClick={() => setSelectedJobId(job.id)}
										type="button"
									>
										{job.id}
									</button>,
									job.type,
									<StatusPill
										className={statusStyles[job.status]}
										key={`${job.id}-status`}
									>
										{job.status}
									</StatusPill>,
									job.priority,
									job.engineer,
									job.scheduledFor,
								],
								id: job.id,
							}))}
						/>
					</div>
					<Card className={panelClass}>
						<CardHeader>
							<CardTitle>
								{selectedJob?.id ?? selectedJobId} audit trail
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<StateMachine currentStatus={selectedJob?.status ?? "Created"} />
							<div className="rounded-sm border border-[#d8dee8] bg-[#f8fafc] p-3 text-sm">
								<p className="font-medium">Latest event</p>
								<p className="mt-1 text-[#64748b]">{selectedJob?.audit}</p>
							</div>
							<div className="grid grid-cols-2 gap-3 text-sm">
								<Metric
									label="Timer"
									value={`${selectedJob?.timerMinutes ?? 0} min`}
								/>
								<Metric label="Cost" value={`HK$${selectedJob?.cost ?? 0}`} />
							</div>
						</CardContent>
					</Card>
				</div>
			</PageFrame>
		);
	}

	if (activeView === "assets") {
		return (
			<PageFrame
				action={
					<Button className={primaryActionClass}>
						<PlusIcon className="size-4" />
						Register asset
					</Button>
				}
				eyebrow="B. Asset & Device Management"
				title="Installed asset registry"
			>
				<DataTable
					columns={[
						"Asset",
						"Model",
						"Hospital",
						"Location",
						"NFC UID",
						"Coverage",
						"Next PM",
					]}
					rows={assets.map((asset) => ({
						cells: [
							<span className="font-medium" key={`${asset.id}-label`}>
								{asset.id}
							</span>,
							asset.model,
							asset.hospital,
							asset.location,
							asset.nfcUid,
							asset.contractCoverage,
							asset.nextPmDue,
						],
						id: asset.id,
					}))}
				/>
			</PageFrame>
		);
	}

	if (activeView === "products") {
		return (
			<PageFrame
				action={
					<Button className={primaryActionClass}>
						<PlusIcon className="size-4" />
						New product
					</Button>
				}
				eyebrow="B-05 Product Catalogue"
				title="Product models and service manuals"
			>
				<DataTable
					columns={[
						"Model",
						"Default PM cycle",
						"Parts list",
						"Manual",
						"Engineer access",
					]}
					rows={[
						{
							cells: [
								"Maxi Move Floor Lift",
								"6 months",
								"Sling bar, castor kit, battery module",
								"maxi-move-service.pdf",
								"Read-only",
							],
							id: "product-maxi-move",
						},
						{
							cells: [
								"Sara Flex Standing Aid",
								"6 months",
								"Battery module, hand control, actuator",
								"sara-flex-manual.pdf",
								"Read-only",
							],
							id: "product-sara-flex",
						},
						{
							cells: [
								"Citadel Patient Therapy System",
								"3 months",
								"Pump filter, mattress cell, control panel",
								"citadel-therapy.pdf",
								"Read-only",
							],
							id: "product-citadel",
						},
					]}
				/>
			</PageFrame>
		);
	}

	if (activeView === "hospitals") {
		return (
			<PageFrame
				action={
					<Button className={primaryActionClass}>
						<PlusIcon className="size-4" />
						New hospital
					</Button>
				}
				eyebrow="Tenant sites"
				title="Hospitals and contract status"
			>
				<DataTable
					columns={[
						"Hospital",
						"District",
						"Contract",
						"Assets",
						"Open jobs",
						"Location",
					]}
					rows={hospitals.map((hospital) => ({
						cells: [
							hospital.name,
							hospital.district,
							<StatusPill
								className={contractStatusStyles[hospital.contractStatus]}
								key={`${hospital.id}-status`}
							>
								{hospital.contractStatus}
							</StatusPill>,
							hospital.assets,
							hospital.openJobs,
							`${hospital.lat}, ${hospital.lng}`,
						],
						id: hospital.id,
					}))}
				/>
			</PageFrame>
		);
	}

	if (activeView === "engineers") {
		return (
			<PageFrame
				action={
					<Button className={primaryActionClass}>
						<PlusIcon className="size-4" />
						New engineer
					</Button>
				}
				eyebrow="F-01 Engineer Management"
				title="Engineer profiles and rates"
			>
				<DataTable
					columns={[
						"Engineer",
						"Grade",
						"Status",
						"Region",
						"Hourly",
						"Mileage",
						"Meal cap",
					]}
					rows={engineers.map((engineer) => ({
						cells: [
							engineer.name,
							engineer.grade,
							<div
								className="flex items-center gap-2"
								key={`${engineer.id}-status`}
							>
								<span
									className={`size-2 rounded-full ${engineerStatusStyles[engineer.status]}`}
								/>
								{engineer.status}
							</div>,
							engineer.region,
							`HK$${engineer.hourlyRate}`,
							`HK$${engineer.mileageRate}/km`,
							`HK$${engineer.mealCap}`,
						],
						id: engineer.id,
					}))}
				/>
			</PageFrame>
		);
	}

	if (activeView === "contracts") {
		return (
			<PageFrame
				action={
					<Button className={primaryActionClass}>
						<PlusIcon className="size-4" />
						New contract
					</Button>
				}
				eyebrow="C. Contract Management"
				title="Coverage and expiry controls"
			>
				<div className="grid gap-4 lg:grid-cols-3">
					{contracts.map((contract) => (
						<Card className={panelClass} key={contract.id}>
							<CardHeader>
								<div className="flex items-start justify-between gap-3">
									<CardTitle>{contract.hospital}</CardTitle>
									<StatusPill className={contractStatusStyles[contract.status]}>
										{contract.status}
									</StatusPill>
								</div>
							</CardHeader>
							<CardContent className="space-y-3 text-sm">
								<Metric label="Contract" value={contract.id} />
								<Metric label="Type" value={contract.type} />
								<Metric label="SLA" value={`${contract.slaHours}h response`} />
								<Metric label="Expiry" value={contract.expiry} />
								<div>
									<p className="text-[#64748b] text-xs">Covered models</p>
									<p className="mt-1">{contract.coveredModels.join(", ")}</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</PageFrame>
		);
	}

	if (activeView === "map") {
		return (
			<PageFrame
				eyebrow="F. Location Operations"
				title="Live map and geofence alerts"
			>
				<div className="grid gap-4 xl:grid-cols-[1fr_360px]">
					<div className="relative min-h-[560px] overflow-hidden rounded-sm border border-[#cbd5e1] bg-[#dbeafe]">
						<div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,118,110,.08)_1px,transparent_1px),linear-gradient(rgba(15,118,110,.08)_1px,transparent_1px)] bg-[size:44px_44px]" />
						<div className="absolute top-8 left-[18%]">
							<MapPin label="Queen Mary" status="Active" />
						</div>
						<div className="absolute top-[34%] right-[20%]">
							<MapPin label="Prince of Wales" status="Expiring" />
						</div>
						<div className="absolute right-[34%] bottom-[22%]">
							<MapPin label="United Christian" status="Active" />
						</div>
						<div className="absolute bottom-[14%] left-[24%]">
							<MapPin label="Princess Margaret" status="Expired" />
						</div>
						<div className="absolute top-[22%] left-[32%]">
							<EngineerDot engineer="Kelvin" status="On-site" />
						</div>
						<div className="absolute top-[48%] right-[28%]">
							<EngineerDot engineer="Mandy" status="In transit" />
						</div>
						<div className="absolute bottom-[30%] left-[42%]">
							<EngineerDot engineer="Ivy" status="Timer anomaly" />
						</div>
						<div className="absolute right-4 bottom-4 rounded-sm border border-[#cbd5e1] bg-white/95 p-3 text-xs shadow-sm">
							<p className="font-medium">Google Maps layer placeholder</p>
							<p className="mt-1 text-[#64748b]">
								Hospital pins and live engineer GPS dots share the same location
								stack.
							</p>
						</div>
					</div>
					<div className="space-y-3">
						{liveAlerts.map((alert) => {
							const Icon = alert.icon;

							return (
								<Card className={panelClass} key={alert.id}>
									<CardContent className="flex gap-3 pt-4">
										<Icon className="mt-0.5 size-5 text-[#0f766e]" />
										<div>
											<p className="font-medium text-sm">{alert.title}</p>
											<p className="mt-1 text-[#64748b] text-xs leading-relaxed">
												{alert.message}
											</p>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>
			</PageFrame>
		);
	}

	if (activeView === "faults") {
		return (
			<PageFrame
				action={
					<Button className={primaryActionClass}>
						<PlusIcon className="size-4" />
						Manual fault
					</Button>
				}
				eyebrow="G. Fault Reporting"
				title="Fault intake and status tracking"
			>
				<DataTable
					columns={[
						"Report",
						"Hospital",
						"Asset",
						"Severity",
						"Status",
						"Description",
					]}
					rows={faultReports.map((fault) => ({
						cells: [
							<span className="font-medium" key={`${fault.id}-label`}>
								{fault.id}
							</span>,
							fault.hospital,
							fault.asset,
							fault.severity,
							<StatusPill
								className={faultStatusStyles[fault.status]}
								key={`${fault.id}-status`}
							>
								{fault.status}
							</StatusPill>,
							fault.description,
						],
						id: fault.id,
					}))}
				/>
			</PageFrame>
		);
	}

	if (activeView === "parts") {
		return (
			<PageFrame
				eyebrow="H. Parts & Inventory"
				title="Inventory and shortage queue"
			>
				<div className="grid gap-4 xl:grid-cols-[1fr_380px]">
					<DataTable
						columns={[
							"Part",
							"Name",
							"Supplier",
							"Stock",
							"Minimum",
							"Unit cost",
						]}
						rows={parts.map((part) => ({
							cells: [
								<span className="font-medium" key={`${part.id}-label`}>
									{part.id}
								</span>,
								part.name,
								part.supplier,
								<span
									className={part.stock < part.minimum ? "text-rose-600" : ""}
									key={`${part.id}-stock`}
								>
									{part.stock}
								</span>,
								part.minimum,
								`HK$${part.unitCost}`,
							],
							id: part.id,
						}))}
					/>
					<Card className={panelClass}>
						<CardHeader>
							<CardTitle>Shortage queue</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{shortages.map((shortage) => (
								<div
									className={`${mutedPanelClass} p-3 text-sm`}
									key={shortage.id}
								>
									<div className="flex items-center justify-between gap-3">
										<p className="font-medium">{shortage.job}</p>
										<StatusPill className="border-amber-200 bg-amber-50 text-amber-700">
											{shortage.status}
										</StatusPill>
									</div>
									<p className="mt-1 text-[#64748b]">
										{shortage.part} requested by {shortage.engineer}
									</p>
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			</PageFrame>
		);
	}

	if (activeView === "reports") {
		return (
			<PageFrame
				eyebrow="I. Reports"
				title="Operational report and job-level cost view"
			>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{reportMetrics.map((metric) => (
						<Card className={panelClass} key={metric.id}>
							<CardContent className="pt-4">
								<p className="text-[#64748b] text-xs">{metric.label}</p>
								<p className="mt-2 font-semibold text-2xl">{metric.value}</p>
								<p className="mt-1 text-[#0f766e] text-xs">{metric.trend}</p>
							</CardContent>
						</Card>
					))}
				</div>
				<div className="mt-4">
					<DataTable
						columns={[
							"Job",
							"Labour",
							"Mileage",
							"Meals",
							"Parts absorbed",
							"Parts billable",
						]}
						rows={[
							{
								cells: [
									"J-1048",
									"HK$899",
									"HK$72",
									"HK$0",
									"HK$0",
									"HK$1,580",
								],
								id: "J-1048-cost",
							},
							{
								cells: ["J-1032", "HK$661", "HK$54", "HK$85", "HK$180", "HK$0"],
								id: "J-1032-cost",
							},
							{
								cells: ["J-1038", "HK$350", "HK$42", "HK$0", "HK$0", "Pending"],
								id: "J-1038-cost",
							},
						]}
					/>
				</div>
			</PageFrame>
		);
	}

	if (activeView === "config") {
		return (
			<PageFrame
				eyebrow="J. System Configuration"
				title="Parameters, roles and notifications"
			>
				<div className="grid gap-4 lg:grid-cols-[1fr_380px]">
					<Card className={panelClass}>
						<CardHeader>
							<CardTitle>System parameters</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-3 md:grid-cols-2">
							{systemParameters.map((parameter) => (
								<Metric
									key={parameter.id}
									label={parameter.label}
									value={parameter.value}
								/>
							))}
						</CardContent>
					</Card>
					<Card className={panelClass}>
						<CardHeader>
							<CardTitle>User roles</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							{["admin", "coordinator", "engineer", "hospital_user"].map(
								(role) => (
									<div
										className="flex items-center justify-between border-[#d8dee8] border-b pb-2 last:border-b-0"
										key={role}
									>
										<span>{role}</span>
										<ShieldCheckIcon className="size-4 text-[#0f766e]" />
									</div>
								)
							)}
						</CardContent>
					</Card>
				</div>
			</PageFrame>
		);
	}

	return (
		<PageFrame eyebrow="Operational Command" title="Today at a glance">
			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
				{dashboardStats.map((stat) => (
					<DashboardStatCard key={stat.id} stat={stat} />
				))}
			</div>
			<div className="mt-3 grid gap-3 xl:grid-cols-[1fr_360px]">
				<Card className={panelClass}>
					<CardHeader className="border-[#e2e8f0] border-b pb-3">
						<CardTitle>Live exception queue</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-2 pt-0">
						{liveAlerts.map((alert) => {
							const Icon = alert.icon;

							return (
								<div
									className="flex gap-3 border-[#eef2f7] border-b py-3 last:border-b-0"
									key={alert.id}
								>
									<div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm bg-[#ecfdf5] text-[#0f766e]">
										<Icon className="size-3.5" />
									</div>
									<div>
										<p className="font-medium text-[13px]">{alert.title}</p>
										<p className="mt-0.5 text-[#64748b] text-xs">
											{alert.message}
										</p>
									</div>
								</div>
							);
						})}
					</CardContent>
				</Card>
				<Card className={panelClass}>
					<CardHeader className="border-[#e2e8f0] border-b pb-3">
						<CardTitle>Release scope coverage</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-3 pt-0">
						{workflowCards.map((card) => {
							const Icon = card.icon;

							return (
								<div className="flex gap-3" key={card.id}>
									<div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm bg-[#f1f5f9] text-[#0f766e]">
										<Icon className="size-3.5" />
									</div>
									<div>
										<p className="font-medium text-[13px]">{card.title}</p>
										<p className="text-[#64748b] text-xs leading-relaxed">
											{card.detail}
										</p>
									</div>
								</div>
							);
						})}
					</CardContent>
				</Card>
			</div>
			<div className="mt-3">
				<PanelHeader title="Today jobs" />
				<DataTable
					columns={[
						"Job",
						"Hospital",
						"Asset",
						"Engineer",
						"Status",
						"Schedule",
					]}
					rows={jobs.slice(0, 5).map((job) => ({
						cells: [
							<span className="font-medium text-[#0f766e]" key={`${job.id}-id`}>
								{job.id}
							</span>,
							job.hospital,
							job.asset,
							job.engineer,
							<StatusPill
								className={statusStyles[job.status]}
								key={`${job.id}-status`}
							>
								{job.status}
							</StatusPill>,
							job.scheduledFor,
						],
						id: `${job.id}-dashboard`,
					}))}
				/>
			</div>
		</PageFrame>
	);
}

function EngineerWorkspace({
	jobRuntimeStatus,
	manualAnswers,
	manualQuery,
	onJobAction,
	selectedAsset,
	selectedEngineer,
	selectedJob,
	setManualQuery,
}: {
	jobRuntimeStatus: JobStatus;
	manualAnswers: ManualAnswer[];
	manualQuery: string;
	onJobAction: (action: JobAction) => void;
	selectedAsset: (typeof assets)[number];
	selectedEngineer: string;
	selectedJob?: Job;
	setManualQuery: (query: string) => void;
}) {
	return (
		<section className="grid flex-1 gap-4 p-4 lg:grid-cols-[390px_1fr] lg:p-6">
			<div className="rounded-[28px] border border-[#1f2937] bg-[#111827] p-3 shadow-xl">
				<div className="overflow-hidden rounded-[22px] bg-white">
					<div className="bg-[#0f766e] px-4 py-5 text-white">
						<p className="text-white/70 text-xs uppercase tracking-[0.16em]">
							Engineer App
						</p>
						<h2 className="mt-1 font-semibold text-xl">{selectedEngineer}</h2>
						<p className="text-sm text-white/80">
							Clocked in · GPS active · Weak WiFi queue ready
						</p>
					</div>
					<div className="space-y-4 p-4">
						<Card className={panelClass}>
							<CardContent className="space-y-3 pt-4">
								<div className="flex items-center justify-between">
									<p className="font-semibold">
										{selectedJob?.id} · {selectedJob?.type}
									</p>
									<StatusPill className={statusStyles[jobRuntimeStatus]}>
										{jobRuntimeStatus}
									</StatusPill>
								</div>
								<p className="text-[#64748b] text-sm">
									{selectedJob?.hospital}
								</p>
								<div className="rounded-sm bg-[#f8fafc] p-3 text-sm">
									<p className="font-medium">{selectedAsset.model}</p>
									<p className="text-[#64748b]">{selectedAsset.location}</p>
									<p className="mt-2 text-[#0f766e] text-xs">
										NFC UID: {selectedAsset.nfcUid}
									</p>
								</div>
								<div className="grid grid-cols-2 gap-2">
									<Button
										className={primaryActionClass}
										onClick={() => onJobAction("start")}
									>
										<PlayCircleIcon className="size-4" />
										NFC start
									</Button>
									<Button
										onClick={() => onJobAction("pause")}
										variant="outline"
									>
										<PauseCircleIcon className="size-4" />
										Parts pause
									</Button>
									<Button
										onClick={() => onJobAction("resume")}
										variant="outline"
									>
										<ClockIcon className="size-4" />
										Resume
									</Button>
									<Button
										onClick={() => onJobAction("complete")}
										variant="outline"
									>
										<CheckCircle2Icon className="size-4" />
										NFC end
									</Button>
								</div>
							</CardContent>
						</Card>

						<Card className={panelClass}>
							<CardHeader>
								<CardTitle>Log expenses and parts</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<Metric label="Mileage" value="15 km · HK$72" />
								<Metric label="Meal receipt" value="Required photo" />
								<Metric label="Parts billing" value="Auto contract check" />
							</CardContent>
						</Card>
					</div>
				</div>
			</div>

			<div className="space-y-4">
				<PageHeader
					eyebrow="Engineer workflow"
					title="NFC, geofence, manual Q&A and offline sync"
				/>
				<div className="grid gap-4 xl:grid-cols-3">
					<FeatureTile
						icon={<NfcIcon className="size-5" />}
						text="Start requires matching asset uid. End validates the hospital geofence before submission."
						title="NFC scan to start/end"
					/>
					<FeatureTile
						icon={<LocateFixedIcon className="size-5" />}
						text="Tracking activates during work hours and is retained for 30 days."
						title="GPS clock-in/out"
					/>
					<FeatureTile
						icon={<BellRingIcon className="size-5" />}
						text="Assignments, resumed jobs, geofence alerts and status changes reach the engineer app."
						title="Push notifications"
					/>
				</div>
				<Card className={panelClass}>
					<CardHeader>
						<CardTitle>Natural language service manual Q&A</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-2">
							<Input
								onChange={(event) => setManualQuery(event.target.value)}
								placeholder="Ask the scanned device manual..."
								value={manualQuery}
							/>
							<Button className={primaryActionClass}>
								<SearchIcon className="size-4" />
								Search
							</Button>
						</div>
						<div className="grid gap-3">
							{manualAnswers.map((answer) => (
								<div className={`${mutedPanelClass} p-3`} key={answer.id}>
									<div className="flex items-center justify-between gap-3">
										<p className="font-medium text-sm">{answer.title}</p>
										<StatusPill className="border-blue-200 bg-blue-50 text-blue-700">
											Page {answer.page}
										</StatusPill>
									</div>
									<p className="mt-2 text-[#64748b] text-sm">
										{answer.excerpt}
									</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</section>
	);
}

function HospitalFaultPortal({
	faultStatus,
	setFaultStatus,
}: {
	faultStatus: FaultStatus;
	setFaultStatus: (status: FaultStatus) => void;
}) {
	return (
		<section className="mx-auto grid w-full max-w-6xl flex-1 gap-6 p-4 lg:grid-cols-[0.9fr_1.1fr] lg:p-6">
			<div>
				<PageHeader
					eyebrow="Hospital mobile web"
					title="Report a fault without installing an app"
				/>
				<p className="mt-3 max-w-xl text-[#64748b] text-sm leading-relaxed">
					Hospital staff open a Utiliti link, scan an NFC sticker on Android or
					search by asset, add fault details and photos, then track status from
					received to resolved.
				</p>
				<div className="mt-5 grid gap-3 sm:grid-cols-2">
					<FeatureTile
						icon={<NfcIcon className="size-5" />}
						text="Device data is pre-filled from the commissioned asset record."
						title="NFC or manual lookup"
					/>
					<FeatureTile
						icon={<UploadIcon className="size-5" />}
						text="Staff attach fault photos before the report reaches Back Office."
						title="Photo evidence"
					/>
					<FeatureTile
						icon={<MessageSquareTextIcon className="size-5" />}
						text="Hospitals can check status without calling Arjo coordinators."
						title="Status tracking"
					/>
					<FeatureTile
						icon={<ArrowRightIcon className="size-5" />}
						text="Coordinators can generate a repair job from the same screen."
						title="Repair job handoff"
					/>
				</div>
			</div>

			<Card className={panelClass}>
				<CardHeader>
					<CardTitle>Fault report form</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-sm border border-[#d8dee8] bg-[#f8fafc] p-3">
						<div className="flex items-center gap-2 text-[#0f766e] text-sm">
							<NfcIcon className="size-4" />
							NFC scan matched asset AST-10031
						</div>
						<p className="mt-2 font-medium">Sara Flex Standing Aid</p>
						<p className="text-[#64748b] text-sm">
							Prince of Wales Hospital · Ward 10B / Bay 3
						</p>
					</div>
					<div className="grid gap-3 md:grid-cols-2">
						<Field label="Severity" value="High" />
						<Field label="Contact" value="Ward 10B nurse station" />
					</div>
					<div>
						<Label htmlFor="fault-description">Fault description</Label>
						<textarea
							className="mt-2 min-h-28 w-full rounded-sm border border-[#cbd5e1] bg-white p-3 text-sm outline-none focus:border-[#0f766e]"
							defaultValue="Standing aid battery does not hold charge and shows warning after short use."
							id="fault-description"
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button variant="outline">
							<UploadIcon className="size-4" />
							Add photos
						</Button>
						<Button
							className={primaryActionClass}
							onClick={() => setFaultStatus("Engineer Assigned")}
						>
							Submit report
						</Button>
					</div>
					<div className={`${mutedPanelClass} p-3`}>
						<p className="font-medium text-sm">Current status</p>
						<div className="mt-3 grid gap-2 sm:grid-cols-4">
							{(
								[
									"Received",
									"Engineer Assigned",
									"In Progress",
									"Resolved",
								] as const
							).map((status) => (
								<button
									className={`rounded-sm border px-2 py-2 text-xs ${
										faultStatus === status
											? faultStatusStyles[status]
											: "border-[#d8dee8] bg-white text-[#64748b]"
									}`}
									key={status}
									onClick={() => setFaultStatus(status)}
									type="button"
								>
									{status}
								</button>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</section>
	);
}

function PageFrame({
	action,
	children,
	eyebrow,
	title,
}: {
	action?: ReactNode;
	children: ReactNode;
	eyebrow: string;
	title: string;
}) {
	return (
		<div className="mx-auto max-w-[1240px]">
			<div className="mb-4 flex flex-col gap-3 border-[#d8dee8] border-b pb-3 sm:flex-row sm:items-end sm:justify-between">
				<PageHeader eyebrow={eyebrow} title={title} />
				{action}
			</div>
			{children}
		</div>
	);
}

function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
	return (
		<div>
			<p className="font-medium text-[#0f766e] text-[11px] uppercase tracking-[0.14em]">
				{eyebrow}
			</p>
			<h2 className="mt-1 font-semibold text-[22px] tracking-tight">{title}</h2>
		</div>
	);
}

function FilterBar({ fields }: { fields: string[] }) {
	return (
		<div className={`${panelClass} p-3`}>
			<div className="flex flex-col gap-3 md:flex-row md:items-center">
				{fields.map((field, index) => (
					<Input
						className={index === 0 ? "md:max-w-64" : "md:max-w-48"}
						key={field}
						placeholder={field}
						readOnly
					/>
				))}
			</div>
		</div>
	);
}

function DataTable({ columns, rows }: { columns: string[]; rows: TableRow[] }) {
	return (
		<div className={`${panelClass} overflow-hidden`}>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[760px] border-collapse text-[13px]">
					<thead className="bg-[#f8fafc] text-[#64748b]">
						<tr>
							{columns.map((column) => (
								<th
									className="border-[#d8dee8] border-b px-3 py-2 text-left font-medium text-[11px] uppercase tracking-[0.08em]"
									key={column}
								>
									{column}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr
								className="border-[#eef2f7] border-b transition-colors last:border-b-0 hover:bg-[#f8fafc]"
								key={row.id}
							>
								{row.cells.map((cell, cellIndex) => (
									<td
										className="px-3 py-2.5 align-top text-[#334155]"
										key={`${row.id}-${columns[cellIndex] ?? "cell"}`}
									>
										{cell}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function PanelHeader({ title }: { title: string }) {
	return (
		<div className="border-[#d8dee8] border-x border-t bg-white px-4 py-3">
			<p className="font-medium text-sm">{title}</p>
		</div>
	);
}

function StatusPill({
	children,
	className,
}: {
	children: ReactNode;
	className: string;
}) {
	return (
		<span
			className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-medium text-[11px] ${className}`}
		>
			{children}
		</span>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className={`${mutedPanelClass} p-3`}>
			<p className="text-[#64748b] text-xs">{label}</p>
			<p className="mt-1 font-medium text-sm">{value}</p>
		</div>
	);
}

function DashboardStatCard({
	stat,
}: {
	stat: (typeof dashboardStats)[number];
}) {
	return (
		<Card className={`${panelClass} border-t-2 border-t-[#0f766e]`}>
			<CardContent className="pt-3">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-[#64748b] text-[11px] uppercase tracking-[0.08em]">
							{stat.label}
						</p>
						<p className="mt-2 font-semibold text-2xl text-[#0f172a]">
							{stat.value}
						</p>
					</div>
					<span className="mt-0.5 size-2 rounded-full bg-[#0f766e]" />
				</div>
				<p className="mt-2 border-[#eef2f7] border-t pt-2 text-[#64748b] text-xs">
					{stat.meta}
				</p>
			</CardContent>
		</Card>
	);
}

function Field({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<Label>{label}</Label>
			<Input className="mt-2" defaultValue={value} />
		</div>
	);
}

function StateMachine({ currentStatus }: { currentStatus: JobStatus }) {
	const activeIndex = serviceStateMachine.indexOf(
		currentStatus as (typeof serviceStateMachine)[number]
	);

	return (
		<div className="space-y-2">
			{serviceStateMachine.map((state, index) => {
				const complete = activeIndex >= index && activeIndex !== -1;

				return (
					<div className="flex items-center gap-2 text-sm" key={state}>
						<span
							className={`flex size-5 items-center justify-center rounded-full border ${
								complete
									? "border-[#0f766e] bg-[#0f766e] text-white"
									: "border-[#cbd5e1] bg-white"
							}`}
						>
							{complete ? <CheckCircle2Icon className="size-3" /> : index + 1}
						</span>
						<span className={complete ? "font-medium" : "text-[#64748b]"}>
							{state}
						</span>
					</div>
				);
			})}
		</div>
	);
}

function FeatureTile({
	icon,
	text,
	title,
}: {
	icon: ReactNode;
	text: string;
	title: string;
}) {
	return (
		<div className={`${panelClass} p-4`}>
			<div className="flex size-9 items-center justify-center rounded-sm bg-[#ecfdf5] text-[#0f766e]">
				{icon}
			</div>
			<p className="mt-3 font-medium text-sm">{title}</p>
			<p className="mt-1 text-[#64748b] text-xs leading-relaxed">{text}</p>
		</div>
	);
}

function MapPin({ label, status }: { label: string; status: ContractStatus }) {
	const colorByStatus: Record<ContractStatus, string> = {
		Active: "bg-emerald-500",
		Expired: "bg-zinc-500",
		Expiring: "bg-amber-500",
	};

	return (
		<div className="flex items-center gap-2 rounded-sm border border-[#cbd5e1] bg-white px-2 py-1 text-xs shadow-sm">
			<span className={`size-3 rounded-full ${colorByStatus[status]}`} />
			{label}
		</div>
	);
}

function EngineerDot({
	engineer,
	status,
}: {
	engineer: string;
	status: EngineerStatus;
}) {
	return (
		<div className="flex items-center gap-2 rounded-sm bg-[#172033] px-2 py-1 text-white text-xs shadow-sm">
			<span className={`size-3 rounded-full ${engineerStatusStyles[status]}`} />
			{engineer}
		</div>
	);
}
