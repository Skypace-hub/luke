import { Ionicons } from "@expo/vector-icons";
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
	jobTypeLabel,
	ScreenHeader,
	SectionLabel,
	SelectOption,
	ShiftStatus,
	TextField,
} from "@/components/engineer-app/engineer-ui";
import { JobCard } from "@/components/engineer-app/job-card";
import { PartsList } from "@/components/engineer-app/parts-list";

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
	const { jobs, selectJob } = useEngineerApp();

	return (
		<EngineerScreen>
			<BrandHeader />
			<ShiftStatus />
			<ScreenHeader
				subtitle="Wednesday, 27 May · 3 assigned"
				title="Today's Jobs"
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
							Route order locked
						</Text>
						<Text style={{ color: colors.text2, fontSize: 12, marginTop: 3 }}>
							Urgent repairs stay pinned above planned maintenance.
						</Text>
					</View>
				</View>
			</Card>
		</EngineerScreen>
	);
}

function JobDetailScreen() {
	const { selectedJob, setJobStage, startSelectedJob } = useEngineerApp();
	const tone = jobTone(selectedJob.type);
	const isInstallation = selectedJob.type === "installation";

	return (
		<EngineerScreen>
			<ShiftStatus />
			<ScreenHeader
				backLabel="Jobs"
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
				<Badge tone={tone}>{jobTypeLabel(selectedJob.type)}</Badge>
				<Badge>Assigned</Badge>
			</View>
			<Card>
				<InfoRow label="Hospital" value={selectedJob.site} />
				<InfoRow label="Location" value={selectedJob.location} />
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
					isInstallation ? "Start Installation" : "Scan NFC / QR - Start Job"
				}
				onPress={startSelectedJob}
			/>
			<View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
				<View style={{ flex: 1 }}>
					<GhostButton
						icon="document-text"
						label="Service Manual"
						onPress={() => undefined}
					/>
				</View>
				<View style={{ flex: 1 }}>
					<GhostButton
						icon="cube"
						label="Parts List"
						onPress={() => setJobStage("parts")}
					/>
				</View>
			</View>
		</EngineerScreen>
	);
}

function ActiveJobScreen() {
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
					<Badge tone="blue">Job In Progress</Badge>
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
						Job #{selectedJob.id} · NFC confirmed · Timer running
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
						label="Manual"
						onPress={() => undefined}
					/>
				</View>
				<View style={{ flex: 1 }}>
					<GhostButton
						icon="cube"
						label="Parts"
						onPress={() => setJobStage("parts")}
					/>
				</View>
			</View>
			<ActionButton
				icon="pause-circle"
				label="Pause Job"
				onPress={() => setJobStage("pause")}
				tone="amber"
			/>
			<ActionButton
				icon="scan-circle"
				label="Scan NFC / QR - Complete Job"
				onPress={() => setJobStage("submit-record")}
			/>
		</EngineerScreen>
	);
}

function PauseJobScreen() {
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
			<SectionLabel>Select missing parts - {selectedJob.device}</SectionLabel>
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
	const { selectedJob, setJobStage } = useEngineerApp();

	return (
		<EngineerScreen>
			<ScreenHeader
				backLabel="Active Job"
				onBack={() => setJobStage("active")}
				subtitle={`NFC confirmed · Job #${selectedJob.id}`}
				title="Submit Record"
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
					<Badge tone="green">Job Complete</Badge>
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
						<Text style={{ color: colors.text2, fontSize: 13 }}>Photos</Text>
					</View>
					<Text
						style={{ color: colors.blueLight, fontSize: 13, fontWeight: "700" }}
					>
						Add photo
					</Text>
				</View>
			</Card>
			<ActionButton
				icon="arrow-forward-circle"
				label="Submit Record"
				onPress={() => setJobStage("parts")}
			/>
		</EngineerScreen>
	);
}

function LogPartsScreen() {
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
				backLabel="Submit Record"
				onBack={() => setJobStage("submit-record")}
				subtitle={`${selectedJob.device} · Job #${selectedJob.id}`}
				title="Log Parts Used"
			/>
			<Card
				style={{
					backgroundColor: colors.amberDim,
					borderColor: "rgba(245,166,35,0.25)",
				}}
			>
				<Text style={{ color: colors.amber, fontSize: 12, lineHeight: 18 }}>
					Log parts used during this job. Parts records are linked to this job
					in the system.
				</Text>
			</Card>
			<TextField label="Search parts" placeholder="Search parts..." />
			<SectionLabel>Standard parts for this model</SectionLabel>
			<PartsList
				onChangeQuantity={setQuantity}
				parts={selectedJob.parts}
				quantities={quantities}
			/>
			<ActionButton
				icon="save"
				label={`Save Parts (${totalItems} item${totalItems === 1 ? "" : "s"})`}
				onPress={completeSelectedJob}
			/>
		</EngineerScreen>
	);
}

function JobCompleteScreen() {
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
					Job Complete
				</Text>
				<Text style={{ color: colors.text2, fontSize: 13, marginTop: 6 }}>
					Record submitted · Back office notified
				</Text>
			</View>
			<Card style={{ marginTop: 24 }}>
				<InfoRow label="Duration" tone="blue" value={selectedJob.duration} />
				<InfoRow label="Parts logged" value="1 item" />
				<InfoRow isLast label="Record" value="SR-20260527-042" />
			</Card>
			<ActionButton
				icon="list"
				label="Back to Jobs"
				onPress={() => setJobStage("list")}
			/>
		</EngineerScreen>
	);
}
