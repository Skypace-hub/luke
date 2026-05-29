import { Ionicons } from "@expo/vector-icons";
import { translateServiceText } from "@luke/i18n";
import { Text, View } from "react-native";
import { useEngineerApp } from "@/components/engineer-app/engineer-app-context";
import {
	ActionButton,
	Badge,
	Card,
	colors,
	Divider,
	EngineerScreen,
	GhostButton,
	InfoRow,
	ScreenHeader,
	SectionLabel,
	SelectOption,
	TextField,
} from "@/components/engineer-app/engineer-ui";
import { PartsList } from "@/components/engineer-app/parts-list";
import { useI18n } from "@/contexts/i18n-context";
import { knownDevice } from "@/lib/engineer-app-data";

export default function CheckDeviceTab() {
	const { checkDeviceStage } = useEngineerApp();

	if (checkDeviceStage === "known") {
		return <KnownDeviceScreen />;
	}
	if (checkDeviceStage === "unknown") {
		return <UnknownDeviceScreen />;
	}
	if (checkDeviceStage === "fault") {
		return <ReportFaultScreen />;
	}
	return <ScanDeviceScreen />;
}

function ScanDeviceScreen() {
	const { locale } = useI18n();
	const { setCheckDeviceStage } = useEngineerApp();

	return (
		<EngineerScreen>
			<View style={{ alignItems: "center", paddingTop: 20 }}>
				<Text style={{ color: colors.text, fontSize: 28, fontWeight: "900" }}>
					{translateServiceText(locale, "Check Device")}
				</Text>
				<Text style={{ color: colors.text2, fontSize: 13, marginTop: 6 }}>
					{translateServiceText(locale, "Tap NFC or scan QR on any device")}
				</Text>
				<View
					style={{
						alignItems: "center",
						borderColor: "rgba(43,142,240,0.32)",
						borderRadius: 68,
						borderWidth: 2,
						height: 136,
						justifyContent: "center",
						marginVertical: 30,
						width: 136,
					}}
				>
					<View
						style={{
							alignItems: "center",
							backgroundColor: colors.blueGlow,
							borderRadius: 42,
							height: 84,
							justifyContent: "center",
							width: 84,
						}}
					>
						<Ionicons color={colors.blueLight} name="scan" size={40} />
					</View>
				</View>
				<Text style={{ color: colors.text3, fontSize: 12 }}>
					{translateServiceText(locale, "Hold phone near tag")} ·{" "}
					{translateServiceText(locale, "or scan QR code")}
				</Text>
				<Text
					style={{
						color: colors.text3,
						fontSize: 12,
						lineHeight: 18,
						marginTop: 18,
						textAlign: "center",
					}}
				>
					{translateServiceText(locale, "Works on any device in any hospital.")}
				</Text>
			</View>
			<ActionButton
				icon="checkmark-circle"
				label="Simulate known device scan"
				onPress={() => setCheckDeviceStage("known")}
			/>
			<ActionButton
				icon="help-circle"
				label="Simulate unknown tag"
				onPress={() => setCheckDeviceStage("unknown")}
				tone="amber"
			/>
			<Divider />
			<GhostButton
				icon="search"
				label="Search by serial number"
				onPress={() => setCheckDeviceStage("known")}
			/>
		</EngineerScreen>
	);
}

function KnownDeviceScreen() {
	const { locale } = useI18n();
	const { selectedJob, setCheckDeviceStage, startSelectedJob } =
		useEngineerApp();

	return (
		<EngineerScreen>
			<ScreenHeader
				backLabel="Check Device"
				onBack={() => setCheckDeviceStage("scan")}
				title="Device Found"
			/>
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
							height: 40,
							justifyContent: "center",
							width: 40,
						}}
					>
						<Ionicons color={colors.blueLight} name="hardware-chip" size={20} />
					</View>
					<View style={{ flex: 1 }}>
						<Text
							style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}
						>
							{knownDevice.name}
						</Text>
						<Text style={{ color: colors.text2, fontSize: 12, marginTop: 2 }}>
							{translateServiceText(locale, knownDevice.category)}
						</Text>
					</View>
					<Badge tone="green">Active</Badge>
				</View>
				<View style={{ marginTop: 10 }}>
					<InfoRow label="Hospital" value={knownDevice.site} />
					<InfoRow label="Location" value={knownDevice.location} />
					<InfoRow label="Serial No." value={knownDevice.serial} />
					<InfoRow
						isLast
						label="Last serviced"
						value={knownDevice.lastServiced}
					/>
				</View>
			</Card>
			<SectionLabel>Recent service history</SectionLabel>
			{knownDevice.history.map((event) => (
				<Card key={event.id}>
					<Text style={{ color: colors.text, fontSize: 14, fontWeight: "800" }}>
						{translateServiceText(locale, event.title)}
					</Text>
					<Text style={{ color: colors.text2, fontSize: 12, marginTop: 3 }}>
						{event.date} · {event.engineer} · {event.duration}
					</Text>
				</Card>
			))}
			<ActionButton
				icon="play"
				label={
					selectedJob.assetId === knownDevice.id
						? "This matches my job - Start"
						: "Open matched job"
				}
				onPress={startSelectedJob}
			/>
			<ActionButton
				icon="warning"
				label="Report Fault"
				onPress={() => setCheckDeviceStage("fault")}
				tone="red"
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
						onPress={() => undefined}
					/>
				</View>
			</View>
		</EngineerScreen>
	);
}

function UnknownDeviceScreen() {
	const { locale } = useI18n();
	const { setAddDeviceStage, setCheckDeviceStage } = useEngineerApp();

	const addDevice = () => {
		setAddDeviceStage("manual");
		setCheckDeviceStage("scan");
	};

	return (
		<EngineerScreen>
			<View style={{ alignItems: "center", paddingTop: 32 }}>
				<View
					style={{
						alignItems: "center",
						borderColor: colors.amber,
						borderRadius: 34,
						borderWidth: 2,
						height: 68,
						justifyContent: "center",
						marginBottom: 18,
						width: 68,
					}}
				>
					<Ionicons color={colors.amber} name="help" size={38} />
				</View>
				<Text style={{ color: colors.text, fontSize: 28, fontWeight: "900" }}>
					{translateServiceText(locale, "Unknown Device")}
				</Text>
				<Text
					style={{
						color: colors.text2,
						fontSize: 13,
						lineHeight: 20,
						marginTop: 8,
						textAlign: "center",
					}}
				>
					{translateServiceText(
						locale,
						"This tag has no device record in the system yet."
					)}
				</Text>
			</View>
			<Card style={{ marginTop: 24 }}>
				<InfoRow label="Tag ID" value="NFC:04:AB:3C:D1:2E" />
				<InfoRow isLast label="Status" tone="amber" value="Not registered" />
			</Card>
			<Text style={{ color: colors.text2, fontSize: 13, lineHeight: 20 }}>
				{translateServiceText(
					locale,
					"You can add this device. Your back office will receive the record to review and complete."
				)}
			</Text>
			<ActionButton
				icon="add-circle"
				label="Add This Device"
				onPress={addDevice}
			/>
			<GhostButton
				icon="mail"
				label="Report issue to back office"
				onPress={() => setCheckDeviceStage("scan")}
			/>
		</EngineerScreen>
	);
}

function ReportFaultScreen() {
	const { locale } = useI18n();
	const { setCheckDeviceStage } = useEngineerApp();

	return (
		<EngineerScreen>
			<ScreenHeader
				backLabel="Device Info"
				onBack={() => setCheckDeviceStage("known")}
				subtitle={`${knownDevice.name} · ICU Rm 302`}
				title="Report Fault"
			/>
			<SectionLabel>Fault type</SectionLabel>
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
				{[
					"Alarm / Error Code",
					"Not powering on",
					"Physical damage",
					"Other",
				].map((item, index) => (
					<View key={item} style={{ width: "48%" }}>
						<SelectOption
							label={item}
							onPress={() => undefined}
							selected={index === 0}
							tone="red"
						/>
					</View>
				))}
			</View>
			<SectionLabel>Severity</SectionLabel>
			<View style={{ flexDirection: "row", gap: 8 }}>
				<SelectOption
					label="Low"
					onPress={() => undefined}
					selected={false}
					tone="green"
				/>
				<SelectOption
					label="High"
					onPress={() => undefined}
					selected
					tone="amber"
				/>
				<SelectOption
					label="Critical"
					onPress={() => undefined}
					selected={false}
					tone="red"
				/>
			</View>
			<View style={{ marginTop: 12 }}>
				<TextField
					label="Description"
					multiline
					value="Alarm fault code E-401 displaying continuously. Patient circuit connected normally."
				/>
			</View>
			<Card>
				<View
					style={{
						alignItems: "center",
						flexDirection: "row",
						justifyContent: "space-between",
					}}
				>
					<Text style={{ color: colors.text2, fontSize: 13 }}>
						{translateServiceText(locale, "Photos")}
					</Text>
					<Text
						style={{ color: colors.blueLight, fontSize: 13, fontWeight: "700" }}
					>
						{translateServiceText(locale, "Add")}
					</Text>
				</View>
			</Card>
			<ActionButton
				icon="send"
				label="Submit Fault Report"
				onPress={() => setCheckDeviceStage("known")}
				tone="red"
			/>
			<SectionLabel>Parts on this device</SectionLabel>
			<PartsList
				parts={knownDevice.parts}
				quantities={Object.fromEntries(
					knownDevice.parts.map((part) => [part.id, part.defaultQuantity])
				)}
			/>
		</EngineerScreen>
	);
}
