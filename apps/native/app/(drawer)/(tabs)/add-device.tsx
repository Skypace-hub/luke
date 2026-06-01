import { Ionicons } from "@expo/vector-icons";
import { translateServiceText } from "@luke/i18n";
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
import { useI18n } from "@/contexts/i18n-context";

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
	const { installationJobs, selectInstallationJob, setAddDeviceStage } =
		useEngineerApp();
	const { locale } = useI18n();

	return (
		<EngineerScreen>
			<ScreenHeader
				subtitle="Select an installation job or add manually"
				title="Add Device"
			/>
			<SectionLabel>Your installation jobs</SectionLabel>
			{installationJobs.length > 0 ? (
				installationJobs.map((job) => (
					<View key={job.id}>
						<JobCard
							compact
							job={job}
							onPress={() => selectInstallationJob(job.id)}
						/>
						<ActionButton
							icon="radio"
							label="Commission NFC Tag"
							onPress={() => selectInstallationJob(job.id)}
						/>
					</View>
				))
			) : (
				<Card>
					<Text style={{ color: colors.text2, fontSize: 13 }}>
						{translateServiceText(
							locale,
							"No installation jobs assigned from backend."
						)}
					</Text>
				</Card>
			)}
			<Card style={{ marginTop: 12 }}>
				<Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>
					{translateServiceText(locale, "Device not in your job list?")}
				</Text>
				<Text
					style={{
						color: colors.text2,
						fontSize: 12,
						lineHeight: 18,
						marginTop: 4,
					}}
				>
					{translateServiceText(
						locale,
						"Add enough detail for back office review and completion."
					)}
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
	const {
		commissionSelectedInstallationTag,
		isActionPending,
		selectedJob,
		setAddDeviceStage,
	} = useEngineerApp();
	const { locale } = useI18n();

	return (
		<EngineerScreen>
			<ScreenHeader
				backLabel="Add Device"
				onBack={() => setAddDeviceStage("list")}
				subtitle={`${translateServiceText(locale, "Job")} #${selectedJob.id} · ${selectedJob.site}`}
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
					{translateServiceText(
						locale,
						"Hold phone near the blank NFC sticker on the new device."
					)}
				</Text>
			</View>
			<Card>
				<InfoRow label="Asset UUID" value={`${selectedJob.assetId}...`} />
				<InfoRow label="Writing" tone="blue" value="NDEF record v1" />
				<InfoRow isLast label="Tag format" value="NTAG213 / 215 / 216" />
			</Card>
			<Text style={{ color: colors.text3, fontSize: 12, lineHeight: 18 }}>
				{translateServiceText(
					locale,
					"This links the NFC sticker to the asset record in the system."
				)}
			</Text>
			<ActionButton
				disabled={isActionPending || !selectedJob.recordId}
				icon="checkmark-circle"
				label="Write Tag to Backend"
				onPress={commissionSelectedInstallationTag}
				tone="green"
			/>
		</EngineerScreen>
	);
}

function ManualDeviceEntryScreen() {
	const { currentDevice, setAddDeviceStage } = useEngineerApp();
	const { locale } = useI18n();

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
					{translateServiceText(
						locale,
						"Fill in what you know. Back office receives this record and completes missing information."
					)}
				</Text>
			</Card>
			<TextField
				label="Device name / model"
				placeholder="e.g. Drager Evita 600"
			/>
			<TextField label="Serial number" placeholder="From label on device" />
			<TextField label="Hospital" value={currentDevice.site} />
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
	const { selectedJob, setAddDeviceStage } = useEngineerApp();
	const { locale } = useI18n();

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
					{translateServiceText(locale, "Tag Linked")}
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
					{translateServiceText(
						locale,
						"Asset record updated. Back office can now see the commissioned device."
					)}
				</Text>
			</View>
			<Card style={{ marginTop: 24 }}>
				<InfoRow label="Asset" value={selectedJob.device} />
				<InfoRow label="Tag payload" tone="blue" value={selectedJob.nfcUid} />
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
