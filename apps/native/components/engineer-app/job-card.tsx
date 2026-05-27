import { Pressable, Text, View } from "react-native";

import type { EngineerJob } from "@/lib/engineer-app-data";

import {
	Badge,
	colors,
	jobTone,
	jobTypeLabel,
	statusTone,
	styles,
} from "./engineer-ui";

interface JobCardProps {
	compact?: boolean;
	job: EngineerJob;
	onPress: () => void;
}

export function JobCard({ job, onPress, compact }: JobCardProps) {
	const tone = jobTone(job.type);
	return (
		<Pressable
			accessibilityLabel={`Open job ${job.id}: ${job.title}`}
			accessibilityRole="button"
			onPress={onPress}
			style={({ pressed }) => [
				styles.card,
				{
					borderLeftColor: toneToColor(tone),
					borderLeftWidth: 3,
					opacity: pressed ? 0.72 : 1,
				},
			]}
		>
			<View
				style={{
					alignItems: "flex-start",
					flexDirection: "row",
					justifyContent: "space-between",
					gap: 12,
				}}
			>
				<View style={{ flex: 1 }}>
					<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
						<Badge tone={tone}>{jobTypeLabel(job.type)}</Badge>
						{job.status === "assigned" ? null : (
							<Badge tone={statusTone(job.status)}>{job.status}</Badge>
						)}
					</View>
					<Text
						style={{
							color: colors.text,
							fontSize: compact ? 14 : 16,
							fontWeight: "800",
							marginTop: 8,
						}}
					>
						{job.title}
					</Text>
					<Text
						style={{
							color: colors.text2,
							fontSize: 12,
							lineHeight: 18,
							marginTop: 3,
						}}
					>
						{job.site} · {job.location}
					</Text>
				</View>
				<Text style={{ color: colors.text2, fontSize: 12, fontWeight: "700" }}>
					{job.scheduledTime}
				</Text>
			</View>
		</Pressable>
	);
}

function toneToColor(tone: ReturnType<typeof jobTone>) {
	if (tone === "red") {
		return colors.red;
	}
	if (tone === "teal") {
		return colors.teal;
	}
	if (tone === "amber") {
		return colors.amber;
	}
	return colors.blue;
}
