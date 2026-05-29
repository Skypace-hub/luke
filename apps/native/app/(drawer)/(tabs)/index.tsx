import { Ionicons } from "@expo/vector-icons";
import { translateServiceText } from "@luke/i18n";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useEngineerApp } from "@/components/engineer-app/engineer-app-context";
import {
	ActionButton,
	Badge,
	BrandHeader,
	Card,
	colors,
	EngineerScreen,
	GhostButton,
	InfoRow,
	jobTone,
	ScreenHeader,
	SectionLabel,
	SelectOption,
	ShiftStatus,
	TextField,
	useJobTypeLabel,
} from "@/components/engineer-app/engineer-ui";
import { JobCard } from "@/components/engineer-app/job-card";
import { PartsList } from "@/components/engineer-app/parts-list";
import { useI18n } from "@/contexts/i18n-context";

export default function JobsTab() {
	const { jobStage } = useEngineerApp();

	if (jobStage === "detail") {
		return <JobDetailScreen />;
	}
	if (jobStage === "active") {
		return <ActiveJobScreen />;
	}
	if (jobStage === "pause") {
		return <PauseJobScreen />;
	}
	if (jobStage === "submit-record") {
		return <SubmitRecordScreen />;
	}
	if (jobStage === "parts") {
		return <LogPartsScreen />;
	}
	if (jobStage === "complete") {
		return <JobCompleteScreen />;
	}
	return <JobListScreen />;
}

function JobListScreen() {
	const { locale, t } = useI18n();
	const { jobs, selectJob } = useEngineerApp();

	return (
		<EngineerScreen>
			<BrandHeader />
			<ShiftStatus />
			<ScreenHeader
				subtitle="Wednesday, 27 May · 3 assigned"
				title={t("native.todayJobs")}
			/>
			{jobs.map((job) => (
				<JobCard job={job} key={job.id} onPress={() => selectJob(job.id)} />
			))}
			<Card
				style={{
					backgroundColor: "rgba(43,142,240,0.08)",
					borderColor: "rgba(43,142,240,0.22)",
				}}
			>
				<View style={{ alignItems: "center", flexDirection: "row", gap: 10 }}>
					<Ionicons color={colors.blueLight} name="navigate-circle" size={22} />
					<View style={{ flex: 1 }}>
						<Text
							style={{ color: colors.text, fontSize: 14, fontWeight: "800" }}
						>
							{translateServiceText(locale, "Route order locked")}
						</Text>
						<Text style={{ color: colors.text2, fontSize: 12, marginTop: 3 }}>
							{translateServiceText(
								locale,
								"Urgent repairs stay pinned above planned maintenance."
							)}
						</Text>
					</View>
				</View>
			</Card>
		</EngineerScreen>
	);
}

function JobDetailScreen() {
	const { locale, t } = useI18n();
	const { selectedJob, setJobStage, startSelectedJob } = useEngineerApp();
	const tone = jobTone(selectedJob.type);
	const isInstallation = selectedJob.type === "installation";
	const getJobTypeLabel = useJobTypeLabel();

	return (
		<EngineerScreen>
			<ShiftStatus />
			<ScreenHeader
				backLabel={t("native.jobs")}
				onBack={() => setJobStage("list")}
				subtitle={selectedJob.title}
				title={`Job #${selectedJob.id}`}
			/>
			<View
				style={{
					flexDirection: "row",
					flexWrap: "wrap",
					gap: 6,
					marginBottom: 10,
				}}
			>
				<Badge tone={tone}>{getJobTypeLabel(selectedJob.type)}</Badge>
				<Badge>{translateServiceText(locale, "Assigned")}</Badge>
			</View>
			<Card>
				<InfoRow
					label={translateServiceText(locale, "Hospital")}
					value={selectedJob.site}
				/>
				<InfoRow
					label={translateServiceText(locale, "Location")}
					value={selectedJob.location}
				/>
				<InfoRow label="Device" value={selectedJob.device} />
				<InfoRow label="Serial No." value={selectedJob.serial} />
				<InfoRow
					isLast
					label="Reported fault"
					tone={selectedJob.type === "urgent" ? "red" : "blue"}
					value={selectedJob.reportedFault}
				/>
			</Card>
			<ActionButton
				icon={isInstallation ? "play-circle" : "scan"}
				label={
					isInstallation
						? t("native.startInstallation")
						: t("native.scanStartJob")
				}
				onPress={startSelectedJob}
			/>
			<View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
				<View style={{ flex: 1 }}>
					<GhostButton
						icon="document-text"
						label={t("native.serviceManual")}
						onPress={() => undefined}
					/>
				</View>
				<View style={{ flex: 1 }}>
					<GhostButton
						icon="cube"
						label={t("native.partsList")}
						onPress={() => setJobStage("parts")}
					/>
				</View>
			</View>
		</EngineerScreen>
	);
}

function ActiveJobScreen() {
	const { locale, t } = useI18n();
	const { selectedJob, setJobStage } = useEngineerApp();

	return (
		<EngineerScreen>
			<ShiftStatus />
			<Card
				style={{
					backgroundColor: "rgba(43,142,240,0.08)",
					borderColor: "rgba(43,142,240,0.22)",
				}}
			>
				<View style={{ alignItems: "center" }}>
					<Badge tone="blue">{t("native.jobInProgress")}</Badge>
					<Text
						style={{
							color: colors.blueLight,
							fontSize: 42,
							fontWeight: "900",
							letterSpacing: -1,
							marginTop: 12,
						}}
					>
						1:23:45
					</Text>
					<Text style={{ color: colors.text2, fontSize: 12, marginTop: 4 }}>
						{`${translateServiceText(locale, "Job")} #${selectedJob.id} · ${translateServiceText(locale, "NFC confirmed")} · ${translateServiceText(locale, "Timer running")}`}
					</Text>
				</View>
			</Card>
			<Card
				style={{
					backgroundColor: colors.surface3,
					borderColor: colors.blueDark,
				}}
			>
				<View style={{ alignItems: "center", flexDirection: "row", gap: 10 }}>
					<View
						style={{
							alignItems: "center",
							backgroundColor: colors.blueGlow,
							borderColor: colors.blueDark,
							borderRadius: 9,
							borderWidth: 1,
							height: 38,
							justifyContent: "center",
							width: 38,
						}}
					>
						<Ionicons color={colors.blueLight} name="hardware-chip" size={19} />
					</View>
					<View style={{ flex: 1 }}>
						<Text
							style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}
						>
							{selectedJob.device}
						</Text>
						<Text style={{ color: colors.text2, fontSize: 12, marginTop: 2 }}>
							{selectedJob.site} · {selectedJob.location}
						</Text>
					</View>
				</View>
			</Card>
			<View style={{ flexDirection: "row", gap: 8 }}>
				<View style={{ flex: 1 }}>
					<GhostButton
						icon="document-text"
						label={t("service.action.viewManual")}
						onPress={() => undefined}
					/>
				</View>
				<View style={{ flex: 1 }}>
					<GhostButton
						icon="cube"
						label={t("native.parts")}
						onPress={() => setJobStage("parts")}
					/>
				</View>
			</View>
			<ActionButton
				icon="pause-circle"
				label={t("native.pauseJob")}
				onPress={() => setJobStage("pause")}
				tone="amber"
			/>
			<ActionButton
				icon="scan-circle"
				label={t("native.scanCompleteJob")}
				onPress={() => setJobStage("submit-record")}
			/>
		</EngineerScreen>
	);
}

function PauseJobScreen() {
	const { locale } = useI18n();
	const { selectedJob, setJobStage, pauseSelectedJob } = useEngineerApp();
	const [reason, setReason] = useState("Parts not available");
	const [selectedParts, setSelectedParts] = useState(
		() => new Set(["flow-sensor"])
	);
	const [notes, setNotes] = useState("");
	const quantities = useMemo(
		() =>
			Object.fromEntries(
				selectedJob.parts.map((part) => [part.id, part.defaultQuantity])
			),
		[selectedJob.parts]
	);

	const togglePart = (partId: string) => {
		setSelectedParts((currentParts) => {
			const nextParts = new Set(currentParts);
			if (nextParts.has(partId)) {
				nextParts.delete(partId);
			} else {
				nextParts.add(partId);
			}
			return nextParts;
		});
	};

	return (
		<EngineerScreen>
			<ScreenHeader
				backLabel="Active Job"
				onBack={() => setJobStage("active")}
				subtitle="This will notify your back office"
				title="Pause Job"
			/>
			<Card
				style={{
					borderColor: "rgba(245,166,35,0.28)",
					borderLeftColor: colors.amber,
					borderLeftWidth: 3,
				}}
			>
				<SectionLabel>Reason for pausing</SectionLabel>
				<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
					{[
						"Parts not available",
						"Awaiting access",
						"Patient in room",
						"Other",
					].map((item) => (
						<View key={item} style={{ width: "48%" }}>
							<SelectOption
								label={item}
								onPress={() => setReason(item)}
								selected={reason === item}
								tone="amber"
							/>
						</View>
					))}
				</View>
			</Card>
			<SectionLabel>
				{translateServiceText(locale, "Select missing parts")} -{" "}
				{selectedJob.device}
			</SectionLabel>
			<PartsList
				onTogglePart={togglePart}
				parts={selectedJob.parts}
				quantities={quantities}
				selectable
				selectedPartIds={selectedParts}
			/>
			<View style={{ marginTop: 12 }}>
				<TextField
					label="Required comments"
					multiline
					onChangeText={setNotes}
					placeholder="Add details for your back office..."
					value={notes}
				/>
			</View>
			<ActionButton
				disabled={notes.trim().length === 0}
				icon="send"
				label="Confirm Pause - Send Report"
				onPress={pauseSelectedJob}
				tone="amber"
			/>
			<GhostButton label="Cancel" onPress={() => setJobStage("active")} />
		</EngineerScreen>
	);
}

function SubmitRecordScreen() {
	const { locale, t } = useI18n();
	const { selectedJob, setJobStage } = useEngineerApp();

	return (
		<EngineerScreen>
			<ScreenHeader
				backLabel={t("native.activeJob")}
				onBack={() => setJobStage("active")}
				subtitle={`${translateServiceText(locale, "NFC confirmed")} · ${translateServiceText(locale, "Job")} #${selectedJob.id}`}
				title={t("native.submitRecord")}
			/>
			<Card>
				<View
					style={{
						alignItems: "center",
						flexDirection: "row",
						justifyContent: "space-between",
						marginBottom: 6,
					}}
				>
					<Badge tone="green">{t("native.jobComplete")}</Badge>
					<Text
						style={{ color: colors.blueLight, fontSize: 13, fontWeight: "800" }}
					>
						{selectedJob.duration}
					</Text>
				</View>
				<InfoRow label="Device confirmed" tone="green" value="NFC matched" />
				<InfoRow
					isLast
					label="Location verified"
					tone="green"
					value="Within 200m"
				/>
			</Card>
			<TextField
				label="Work performed"
				multiline
				value="Replaced expiratory valve kit. Cleared fault code E-401. Device tested and confirmed operational."
			/>
			<TextField
				label="Findings / Notes"
				multiline
				value="No further issues noted. Recommend replacement of O2 cell at next service."
			/>
			<Card style={{ paddingVertical: 12 }}>
				<View
					style={{
						alignItems: "center",
						flexDirection: "row",
						justifyContent: "space-between",
					}}
				>
					<View style={{ flexDirection: "row", gap: 9, alignItems: "center" }}>
						<Ionicons color={colors.text2} name="camera" size={18} />
						<Text style={{ color: colors.text2, fontSize: 13 }}>
							{translateServiceText(locale, "Photos")}
						</Text>
					</View>
					<Text
						style={{ color: colors.blueLight, fontSize: 13, fontWeight: "700" }}
					>
						{translateServiceText(locale, "Add photo")}
					</Text>
				</View>
			</Card>
			<ActionButton
				icon="arrow-forward-circle"
				label={t("native.submitRecord")}
				onPress={() => setJobStage("parts")}
			/>
		</EngineerScreen>
	);
}

function LogPartsScreen() {
	const { locale, t } = useI18n();
	const { selectedJob, setJobStage, completeSelectedJob } = useEngineerApp();
	const [quantities, setQuantities] = useState<Record<string, number>>(() =>
		Object.fromEntries(
			selectedJob.parts.map((part) => [part.id, part.defaultQuantity])
		)
	);
	const totalItems = Object.values(quantities).reduce(
		(total, quantity) => total + quantity,
		0
	);

	const setQuantity = (partId: string, quantity: number) => {
		setQuantities((currentQuantities) => ({
			...currentQuantities,
			[partId]: quantity,
		}));
	};

	return (
		<EngineerScreen>
			<ScreenHeader
				backLabel={t("native.submitRecord")}
				onBack={() => setJobStage("submit-record")}
				subtitle={`${selectedJob.device} · Job #${selectedJob.id}`}
				title={t("native.logPartsUsed")}
			/>
			<Card
				style={{
					backgroundColor: colors.amberDim,
					borderColor: "rgba(245,166,35,0.25)",
				}}
			>
				<Text style={{ color: colors.amber, fontSize: 12, lineHeight: 18 }}>
					{translateServiceText(
						locale,
						"Log parts used during this job. Parts records are linked to this job in the system."
					)}
				</Text>
			</Card>
			<TextField
				label={t("common.search")}
				placeholder={t("form.searchFieldPlaceholder", {
					label: t("native.parts"),
				})}
			/>
			<SectionLabel>{t("form.selectStandardParts")}</SectionLabel>
			<PartsList
				onChangeQuantity={setQuantity}
				parts={selectedJob.parts}
				quantities={quantities}
			/>
			<ActionButton
				icon="save"
				label={`${translateServiceText(locale, "Save Parts")} (${translateServiceText(locale, totalItems === 1 ? "1 item" : "{count} items").replace("{count}", String(totalItems))})`}
				onPress={completeSelectedJob}
			/>
		</EngineerScreen>
	);
}

function JobCompleteScreen() {
	const { locale, t } = useI18n();
	const { selectedJob, setJobStage } = useEngineerApp();

	return (
		<EngineerScreen>
			<View style={{ alignItems: "center", paddingTop: 40 }}>
				<View
					style={{
						alignItems: "center",
						borderColor: colors.green,
						borderRadius: 34,
						borderWidth: 2,
						height: 68,
						justifyContent: "center",
						marginBottom: 18,
						width: 68,
					}}
				>
					<Ionicons color={colors.green} name="checkmark" size={38} />
				</View>
				<Text style={{ color: colors.text, fontSize: 28, fontWeight: "900" }}>
					{t("native.jobComplete")}
				</Text>
				<Text style={{ color: colors.text2, fontSize: 13, marginTop: 6 }}>
					{`${translateServiceText(locale, "Record submitted")} · ${translateServiceText(locale, "Back office notified")}`}
				</Text>
			</View>
			<Card style={{ marginTop: 24 }}>
				<InfoRow label="Duration" tone="blue" value={selectedJob.duration} />
				<InfoRow label="Parts logged" value="1 item" />
				<InfoRow isLast label="Record" value="SR-20260527-042" />
			</Card>
			<ActionButton
				icon="list"
				label={t("native.backToJobs")}
				onPress={() => setJobStage("list")}
			/>
		</EngineerScreen>
	);
}
