import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useEngineerApp } from "@/components/engineer-app/engineer-app-context";
import {
	ActionButton,
	Card,
	colors,
	EngineerScreen,
	GhostButton,
	InfoRow,
	ScreenHeader,
	SectionLabel,
	TextField,
} from "@/components/engineer-app/engineer-ui";
import { JobCard } from "@/components/engineer-app/job-card";
import { installationJobs } from "@/lib/engineer-app-data";

export default function AddDeviceTab() {
	const { addDeviceStage } = useEngineerApp();

	if (addDeviceStage === "commission") {
		return <CommissionTagScreen />;
	}
	if (addDeviceStage === "manual") {
		return <ManualDeviceEntryScreen />;
	}
	if (addDeviceStage === "success") {
		return <TagWriteSuccessScreen />;
	}
	return <AddDeviceHomeScreen />;
}

function AddDeviceHomeScreen() {
	const { setAddDeviceStage } = useEngineerApp();

	return (
		<EngineerScreen>
			<ScreenHeader
				subtitle="Select an installation job or add manually"
				title="Add Device"
			/>
			<SectionLabel>Your installation jobs</SectionLabel>
			{installationJobs.map((job) => (
				<View key={job.id}>
					<JobCard
						compact
						job={job}
						onPress={() => setAddDeviceStage("commission")}
					/>
					<ActionButton
						icon="radio"
						label="Commission NFC Tag"
						onPress={() => setAddDeviceStage("commission")}
					/>
				</View>
			))}
			<Card style={{ marginTop: 12 }}>
				<Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>
					Device not in your job list?
				</Text>
				<Text
					style={{
						color: colors.text2,
						fontSize: 12,
						lineHeight: 18,
						marginTop: 4,
					}}
				>
					Add enough detail for back office review and completion.
				</Text>
				<ActionButton
					icon="create"
					label="Add device manually"
					onPress={() => setAddDeviceStage("manual")}
					tone="amber"
				/>
			</Card>
		</EngineerScreen>
	);
}

function CommissionTagScreen() {
	const { setAddDeviceStage } = useEngineerApp();
	const job = installationJobs[0];

	return (
		<EngineerScreen>
			<ScreenHeader
				backLabel="Add Device"
				onBack={() => setAddDeviceStage("list")}
				subtitle={`Job #${job.id} · ${job.site}`}
				title="Commission Tag"
			/>
			<View style={{ alignItems: "center", paddingVertical: 20 }}>
				<View
					style={{
						alignItems: "center",
						borderColor: "rgba(52,201,126,0.35)",
						borderRadius: 68,
						borderWidth: 2,
						height: 136,
						justifyContent: "center",
						width: 136,
					}}
				>
					<View
						style={{
							alignItems: "center",
							backgroundColor: colors.greenDim,
							borderRadius: 42,
							height: 84,
							justifyContent: "center",
							width: 84,
						}}
					>
						<Ionicons color={colors.green} name="radio" size={40} />
					</View>
				</View>
				<Text
					style={{
						color: colors.text2,
						fontSize: 13,
						lineHeight: 20,
						marginTop: 14,
						textAlign: "center",
					}}
				>
					Hold phone near the blank NFC sticker on the new device.
				</Text>
			</View>
			<Card>
				<InfoRow label="Asset UUID" value={`${job.assetId}...`} />
				<InfoRow label="Writing" tone="blue" value="NDEF record v1" />
				<InfoRow isLast label="Tag format" value="NTAG213 / 215 / 216" />
			</Card>
			<Text style={{ color: colors.text3, fontSize: 12, lineHeight: 18 }}>
				This links the NFC sticker to the asset record in the system.
			</Text>
			<ActionButton
				icon="checkmark-circle"
				label="Simulate Write Success"
				onPress={() => setAddDeviceStage("success")}
				tone="green"
			/>
		</EngineerScreen>
	);
}

function ManualDeviceEntryScreen() {
	const { setAddDeviceStage } = useEngineerApp();

	return (
		<EngineerScreen>
			<ScreenHeader
				backLabel="Add Device"
				onBack={() => setAddDeviceStage("list")}
				subtitle="Back office will review and complete"
				title="Manual Entry"
			/>
			<Card
				style={{
					backgroundColor: colors.blueGlow,
					borderColor: colors.blueDark,
				}}
			>
				<Text style={{ color: colors.blueLight, fontSize: 12, lineHeight: 18 }}>
					Fill in what you know. Back office receives this record and completes
					missing information.
				</Text>
			</Card>
			<TextField
				label="Device name / model"
				placeholder="e.g. Drager Evita 600"
			/>
			<TextField label="Serial number" placeholder="From label on device" />
			<TextField label="Hospital" value="St. Mary's Hospital" />
			<TextField label="Floor" placeholder="e.g. Floor 3, ICU" />
			<TextField label="Room / location" placeholder="e.g. Room 302, Bay B" />
			<TextField
				label="Notes for back office"
				multiline
				placeholder="Anything else they should know..."
			/>
			<ActionButton
				icon="send"
				label="Submit for Review"
				onPress={() => setAddDeviceStage("success")}
			/>
		</EngineerScreen>
	);
}

function TagWriteSuccessScreen() {
	const { setAddDeviceStage } = useEngineerApp();

	return (
		<EngineerScreen>
			<View style={{ alignItems: "center", paddingTop: 42 }}>
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
					Tag Linked
				</Text>
				<Text
					style={{
						color: colors.text2,
						fontSize: 13,
						lineHeight: 20,
						marginTop: 6,
						textAlign: "center",
					}}
				>
					Asset record updated. Back office can now see the commissioned device.
				</Text>
			</View>
			<Card style={{ marginTop: 24 }}>
				<InfoRow label="Asset" value="New Ventilator - ICU" />
				<InfoRow label="Tag payload" tone="blue" value='{"uid":"a3f2bc91"}' />
				<InfoRow isLast label="Status" tone="green" value="Commissioned" />
			</Card>
			<ActionButton
				icon="add-circle"
				label="Add Another Device"
				onPress={() => setAddDeviceStage("list")}
			/>
			<GhostButton
				icon="construct"
				label="Replace damaged tag"
				onPress={() => setAddDeviceStage("commission")}
			/>
		</EngineerScreen>
	);
}
