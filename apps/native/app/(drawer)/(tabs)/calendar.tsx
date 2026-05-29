import { translateServiceText } from "@luke/i18n";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useEngineerApp } from "@/components/engineer-app/engineer-app-context";
import {
	Badge,
	Card,
	colors,
	EngineerScreen,
	ScreenHeader,
	SectionLabel,
	ShiftStatus,
	styles,
} from "@/components/engineer-app/engineer-ui";
import { JobCard } from "@/components/engineer-app/job-card";
import { useI18n } from "@/contexts/i18n-context";
import { calendarDays } from "@/lib/engineer-app-data";

const weekdays = [
	{ id: "monday", label: "M" },
	{ id: "tuesday", label: "T" },
	{ id: "wednesday", label: "W" },
	{ id: "thursday", label: "T" },
	{ id: "friday", label: "F" },
	{ id: "saturday", label: "S" },
	{ id: "sunday", label: "S" },
] as const;

export default function CalendarTab() {
	const { jobs, selectJob } = useEngineerApp();
	const { locale } = useI18n();
	const [selectedDayId, setSelectedDayId] = useState("2026-05-27");
	const selectedDay =
		calendarDays.find((day) => day.id === selectedDayId) ??
		calendarDays.find((day) => day.isToday) ??
		calendarDays[0];
	const selectedJobs = jobs.filter((job) =>
		selectedDay.jobIds.includes(job.id)
	);

	return (
		<EngineerScreen>
			<ShiftStatus />
			<ScreenHeader subtitle="May 2026" title="Calendar" />
			<Card>
				<Text
					style={{
						color: colors.text,
						fontSize: 16,
						fontWeight: "800",
						marginBottom: 12,
						textAlign: "center",
					}}
				>
					May 2026
				</Text>
				<View style={{ flexDirection: "row" }}>
					{weekdays.map((weekday) => (
						<Text
							key={weekday.id}
							style={{
								color: colors.text3,
								flex: 1,
								fontSize: 11,
								fontWeight: "800",
								textAlign: "center",
							}}
						>
							{weekday.label}
						</Text>
					))}
				</View>
				<View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
					{calendarDays.map((day) => (
						<Pressable
							accessibilityLabel={
								day.day === 0
									? translateServiceText(locale, "Empty calendar day")
									: `${translateServiceText(locale, "May")} ${day.day}${
											day.hasJobs
												? `, ${translateServiceText(locale, "has scheduled jobs")}`
												: ""
										}`
							}
							accessibilityRole="button"
							disabled={day.day === 0}
							key={day.id}
							onPress={() => setSelectedDayId(day.id)}
							style={({ pressed }) =>
								getCalendarDayStyle({
									isEmpty: day.day === 0,
									isPressed: pressed,
									isSelected: day.id === selectedDayId,
									isToday: Boolean(day.isToday),
								})
							}
						>
							<Text
								style={{
									color: day.isToday ? colors.white : colors.text2,
									fontSize: 13,
									fontWeight: day.isToday ? "900" : "700",
								}}
							>
								{day.day === 0 ? "" : day.day}
							</Text>
							{day.hasJobs ? (
								<View
									style={{
										backgroundColor: day.isToday ? colors.white : colors.amber,
										borderRadius: 3,
										bottom: 5,
										height: 5,
										position: "absolute",
										width: 5,
									}}
								/>
							) : null}
						</Pressable>
					))}
				</View>
			</Card>
			<View style={{ alignItems: "center", flexDirection: "row", gap: 8 }}>
				<View
					style={{
						backgroundColor: colors.amber,
						borderRadius: 4,
						height: 8,
						width: 8,
					}}
				/>
				<Text style={{ color: colors.text3, fontSize: 12 }}>
					{translateServiceText(locale, "Day has scheduled jobs")}
				</Text>
			</View>
			<SectionLabel>{getSelectedDayLabel(selectedDay, locale)}</SectionLabel>
			{selectedJobs.length > 0 ? (
				selectedJobs.map((job) => (
					<JobCard
						compact
						job={job}
						key={job.id}
						onPress={() => selectJob(job.id)}
					/>
				))
			) : (
				<Card style={{ alignItems: "center", paddingVertical: 28 }}>
					<Badge>No jobs</Badge>
					<Text style={[styles.subtitle, { marginTop: 8 }]}>
						{translateServiceText(locale, "No scheduled work for this day.")}
					</Text>
				</Card>
			)}
		</EngineerScreen>
	);
}

function getCalendarDayStyle({
	isEmpty,
	isPressed,
	isSelected,
	isToday,
}: {
	isEmpty: boolean;
	isPressed: boolean;
	isSelected: boolean;
	isToday: boolean;
}) {
	let backgroundColor = "transparent";
	if (isToday) {
		backgroundColor = colors.blue;
	} else if (isSelected) {
		backgroundColor = colors.blueGlow;
	}

	let opacity = 1;
	if (isEmpty) {
		opacity = 0;
	} else if (isPressed) {
		opacity = 0.72;
	}

	return {
		alignItems: "center" as const,
		backgroundColor,
		borderColor: isSelected && !isToday ? colors.blueDark : "transparent",
		borderRadius: 9,
		borderWidth: 1,
		height: 44,
		justifyContent: "center" as const,
		marginBottom: 4,
		opacity,
		position: "relative" as const,
		width: "14.285%" as const,
	};
}

function getSelectedDayLabel(
	selectedDay: { day: number; isToday?: boolean },
	locale: "en" | "zh-Hans" | "zh-Hant"
) {
	if (selectedDay.isToday) {
		return `${translateServiceText(locale, "Today")} - ${translateServiceText(locale, "27 May")}`;
	}
	if (selectedDay.day) {
		return `${translateServiceText(locale, "May")} ${selectedDay.day}`;
	}
	return translateServiceText(locale, "Select a day");
}
