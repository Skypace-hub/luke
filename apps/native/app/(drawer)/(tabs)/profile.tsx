import { Ionicons } from "@expo/vector-icons";
import { translateServiceText } from "@luke/i18n";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { useEngineerApp } from "@/components/engineer-app/engineer-app-context";
import {
	ActionButton,
	Badge,
	Card,
	colors,
	EngineerScreen,
	GhostButton,
	InfoRow,
	Metric,
	RowButton,
	ScreenHeader,
	SectionLabel,
	SelectOption,
	styles,
	TextField,
} from "@/components/engineer-app/engineer-ui";
import { useI18n } from "@/contexts/i18n-context";

export default function ProfileTab() {
	const { profileStage } = useEngineerApp();

	if (profileStage === "expenses") {
		return <DailyExpensesScreen />;
	}
	if (profileStage === "history") {
		return <JobHistoryScreen />;
	}
	if (profileStage === "performance") {
		return <PerformanceScreen />;
	}
	if (profileStage === "manuals") {
		return <ServiceManualScreen />;
	}
	if (profileStage === "settings") {
		return <SettingsScreen />;
	}
	return <ProfileHomeScreen />;
}

function ProfileHomeScreen() {
	const { clockOut, isActionPending, profile, setProfileStage } =
		useEngineerApp();
	const { locale, t } = useI18n();

	return (
		<EngineerScreen>
			<View
				style={{
					alignItems: "center",
					flexDirection: "row",
					gap: 14,
					marginBottom: 18,
				}}
			>
				<View
					style={{
						alignItems: "center",
						backgroundColor: colors.blueDark,
						borderRadius: 18,
						height: 58,
						justifyContent: "center",
						width: 58,
					}}
				>
					<Text
						style={{ color: colors.white, fontSize: 20, fontWeight: "900" }}
					>
						{profile.initials}
					</Text>
				</View>
				<View style={{ flex: 1 }}>
					<Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>
						{profile.name}
					</Text>
					<Text style={{ color: colors.text2, fontSize: 13, marginTop: 3 }}>
						{translateServiceText(locale, profile.role)} ·{" "}
						{translateServiceText(locale, profile.region)}
					</Text>
					<View style={{ marginTop: 7 }}>
						<Badge tone="green">
							{t("native.shiftActive")} · {profile.shiftDuration}
						</Badge>
					</View>
				</View>
			</View>
			<View style={{ flexDirection: "row", gap: 9, marginBottom: 10 }}>
				<Metric label="Jobs this month" value={profile.jobsThisMonth} />
				<Metric
					label="First-fix rate"
					tone="green"
					value={profile.firstFixRate}
				/>
			</View>
			<Card>
				<InfoRow label="Average resolution" value={profile.averageResolution} />
				<InfoRow
					isLast
					label="Clocked in"
					tone="green"
					value={profile.clockedInAt}
				/>
			</Card>
			<View
				style={{
					borderColor: colors.border,
					borderRadius: 14,
					borderWidth: 1,
					marginTop: 4,
					overflow: "hidden",
				}}
			>
				<RowButton
					icon="receipt"
					onPress={() => setProfileStage("expenses")}
					subtitle="Log mileage, food, other"
					title="Daily Expenses"
					tone="amber"
				/>
				<RowButton
					icon="document-text"
					onPress={() => setProfileStage("history")}
					subtitle="All completed jobs"
					title="Job History"
				/>
				<RowButton
					icon="bar-chart"
					onPress={() => setProfileStage("performance")}
					subtitle="Your stats and metrics"
					title="Performance"
					tone="purple"
				/>
				<RowButton
					icon="library"
					onPress={() => setProfileStage("manuals")}
					subtitle="All device manuals"
					title="Service Manual Library"
					tone="teal"
				/>
				<RowButton
					icon="settings"
					onPress={() => setProfileStage("settings")}
					subtitle="Notifications, preferences"
					title="Settings"
					tone="muted"
				/>
			</View>
			<ActionButton
				disabled={isActionPending}
				icon="log-out"
				label="Clock Out for Today"
				onPress={clockOut}
				tone="red"
			/>
		</EngineerScreen>
	);
}

function DailyExpensesScreen() {
	const {
		expenses,
		isActionPending,
		selectedJob,
		setProfileStage,
		submitExpense: submitExpenseToBackend,
	} = useEngineerApp();
	const { locale } = useI18n();
	const [selectedCategory, setSelectedCategory] = useState("Mileage");
	const [distance, setDistance] = useState("47");
	const total = useMemo(() => {
		const numericDistance = Number.parseFloat(distance);
		if (Number.isNaN(numericDistance)) {
			return "HKD 0.00";
		}
		return `HKD ${(numericDistance * 4.8).toFixed(2)}`;
	}, [distance]);

	const submitCurrentExpense = () => {
		const numericDistance = Number.parseFloat(distance);
		const normalizedDistance = Number.isNaN(numericDistance)
			? 0
			: numericDistance;
		submitExpenseToBackend({
			amount: normalizedDistance * 4.8,
			category: selectedCategory as
				| "Accommodation"
				| "Food"
				| "Mileage"
				| "Other",
			distance: normalizedDistance,
		});
	};

	return (
		<EngineerScreen>
			<ScreenHeader
				backLabel="Profile"
				onBack={() => setProfileStage("home")}
				subtitle="Wednesday, 27 May 2026"
				title="Daily Expenses"
			/>
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
				{["Mileage", "Food", "Accommodation", "Other"].map((category) => (
					<View key={category} style={{ width: "48%" }}>
						<SelectOption
							label={category}
							onPress={() => setSelectedCategory(category)}
							selected={selectedCategory === category}
							tone="amber"
						/>
					</View>
				))}
			</View>
			<View style={{ marginTop: 14 }}>
				<TextField
					keyboardType="numeric"
					label="Distance today (km)"
					onChangeText={setDistance}
					value={distance}
				/>
			</View>
			<Text style={{ color: colors.text3, fontSize: 12, marginBottom: 10 }}>
				HKD 4.80/km · {translateServiceText(locale, "Total")}: {total}
			</Text>
			<TextField
				label="Link to job"
				value={`${translateServiceText(locale, "Job")} #${selectedJob.id} - ${translateServiceText(locale, selectedJob.title)}`}
			/>
			<SectionLabel>Today's logged expenses</SectionLabel>
			<Card>
				{expenses.map((expense, index) => (
					<View
						key={expense.id}
						style={[
							styles.infoRow,
							index === expenses.length - 1 ? styles.infoRowLast : undefined,
						]}
					>
						<View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
							<Ionicons color={colors.text2} name="receipt" size={16} />
							<Text style={{ color: colors.text2, flex: 1, fontSize: 13 }}>
								{translateServiceText(locale, expense.category)} ·{" "}
								{translateServiceText(locale, expense.detail)}
							</Text>
						</View>
						<Text
							style={{ color: colors.amber, fontSize: 13, fontWeight: "800" }}
						>
							{expense.value}
						</Text>
					</View>
				))}
			</Card>
			<ActionButton
				disabled={isActionPending}
				icon="add-circle"
				label="Add Expense"
				onPress={submitCurrentExpense}
			/>
		</EngineerScreen>
	);
}

function JobHistoryScreen() {
	const { jobs, setProfileStage } = useEngineerApp();
	const { locale } = useI18n();

	return (
		<EngineerScreen>
			<ScreenHeader
				backLabel="Profile"
				onBack={() => setProfileStage("home")}
				subtitle="Completed and paused work"
				title="Job History"
			/>
			{jobs.map((job) => (
				<Card key={job.id}>
					<View
						style={{
							alignItems: "center",
							flexDirection: "row",
							justifyContent: "space-between",
							marginBottom: 8,
						}}
					>
						<Badge tone={job.type === "urgent" ? "red" : "blue"}>
							{translateServiceText(locale, "Job")} #{job.id}
						</Badge>
						<Text style={{ color: colors.text3, fontSize: 12 }}>
							{job.duration}
						</Text>
					</View>
					<Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>
						{translateServiceText(locale, job.title)}
					</Text>
					<Text style={{ color: colors.text2, fontSize: 12, marginTop: 3 }}>
						{job.site} · {job.scheduledTime}
					</Text>
				</Card>
			))}
		</EngineerScreen>
	);
}

function PerformanceScreen() {
	const { jobs, profile, setProfileStage } = useEngineerApp();
	const pausedJobs = jobs.filter((job) => job.status === "paused").length;

	return (
		<EngineerScreen>
			<ScreenHeader
				backLabel="Profile"
				onBack={() => setProfileStage("home")}
				subtitle="Month to date"
				title="Performance"
			/>
			<View style={{ flexDirection: "row", gap: 9, marginBottom: 10 }}>
				<Metric label="Jobs complete" value={profile.jobsThisMonth} />
				<Metric
					label="First-fix rate"
					tone="green"
					value={profile.firstFixRate}
				/>
			</View>
			<View style={{ flexDirection: "row", gap: 9, marginBottom: 10 }}>
				<Metric
					label="Average time"
					tone="amber"
					value={profile.averageResolution}
				/>
				<Metric label="Paused jobs" tone="purple" value={String(pausedJobs)} />
			</View>
			<Card>
				<InfoRow label="Urgent response average" tone="green" value="22 min" />
				<InfoRow label="Parts accuracy" tone="green" value="96%" />
				<InfoRow
					isLast
					label="Records sent same day"
					tone="green"
					value="100%"
				/>
			</Card>
		</EngineerScreen>
	);
}

function ServiceManualScreen() {
	const { currentDevice, setProfileStage } = useEngineerApp();
	const { locale } = useI18n();

	return (
		<EngineerScreen>
			<ScreenHeader
				backLabel="Profile"
				onBack={() => setProfileStage("home")}
				subtitle={currentDevice.name}
				title="Service Manual"
			/>
			<Card style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
				<Ionicons color={colors.text3} name="search" size={18} />
				<Text style={{ color: colors.text3, fontSize: 14 }}>
					{translateServiceText(locale, "Search this manual...")}
				</Text>
			</Card>
			<Card>
				<Badge tone="blue">
					{translateServiceText(locale, "Manual")} ·{" "}
					{currentDevice.manualFileUrl
						? translateServiceText(locale, "Uploaded")
						: translateServiceText(locale, "Not uploaded")}
				</Badge>
				<Text
					style={{
						color: colors.text2,
						fontSize: 13,
						lineHeight: 20,
						marginTop: 10,
					}}
				>
					{translateServiceText(
						locale,
						"To replace the expiratory valve kit, first power off and disconnect from patient circuit. Remove the 4 screws on the expiratory module cover."
					)}
				</Text>
				<Text
					style={{
						color: colors.blueLight,
						fontSize: 12,
						fontWeight: "800",
						marginTop: 10,
					}}
				>
					{translateServiceText(locale, "Jump to page 47")}
				</Text>
			</Card>
			<Card>
				<SectionLabel>{translateServiceText(locale, "Page 48")}</SectionLabel>
				<Text style={{ color: colors.text2, fontSize: 13, lineHeight: 20 }}>
					{translateServiceText(
						locale,
						"Step 1: Power off. Step 2: Disconnect patient circuit. Step 3: Remove module cover using Torx T10."
					)}
				</Text>
			</Card>
		</EngineerScreen>
	);
}

function SettingsScreen() {
	const { setProfileStage } = useEngineerApp();

	return (
		<EngineerScreen>
			<ScreenHeader
				backLabel="Profile"
				onBack={() => setProfileStage("home")}
				subtitle="Notifications and preferences"
				title="Settings"
			/>
			<Card>
				<InfoRow label="Push notifications" tone="green" value="Enabled" />
				<InfoRow label="Offline queue" tone="green" value="Ready" />
				<InfoRow
					isLast
					label="Biometric unlock"
					tone="blue"
					value="Available"
				/>
			</Card>
			<GhostButton
				icon="shield-checkmark"
				label="Review privacy controls"
				onPress={() => undefined}
			/>
		</EngineerScreen>
	);
}
