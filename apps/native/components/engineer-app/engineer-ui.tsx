import { Ionicons } from "@expo/vector-icons";
import { translateServiceText } from "@luke/i18n";
import type { PropsWithChildren, ReactNode } from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	type TextInputProps,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "@/contexts/i18n-context";
import type {
	IconName,
	JobStatus,
	JobType,
	PartStatus,
} from "@/lib/engineer-app-data";

export const colors = {
	bg: "#13151a",
	surface: "#1c1f27",
	surface2: "#242830",
	surface3: "#2d3140",
	surface4: "#353a4a",
	border: "#2a2f3d",
	border2: "#363d50",
	text: "#eceef2",
	text2: "#8b92a8",
	text3: "#555d72",
	blue: "#2B8EF0",
	blueLight: "#5AABF5",
	blueDark: "#1A6BC4",
	blueGlow: "rgba(43,142,240,0.18)",
	green: "#34c97e",
	greenDim: "rgba(52,201,126,0.15)",
	amber: "#f5a623",
	amberDim: "rgba(245,166,35,0.15)",
	red: "#f0514b",
	redDim: "rgba(240,81,75,0.15)",
	purple: "#8b5cf6",
	purpleDim: "rgba(139,92,246,0.15)",
	teal: "#14b8a6",
	tealDim: "rgba(20,184,166,0.15)",
	white: "#ffffff",
};

type Tone = "blue" | "green" | "amber" | "red" | "purple" | "teal" | "muted";

interface ScreenProps {
	children: React.ReactNode;
	scroll?: boolean;
}

export function EngineerScreen({ children, scroll = true }: ScreenProps) {
	const insets = useSafeAreaInsets();

	if (!scroll) {
		return (
			<View
				style={[
					styles.screen,
					{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
				]}
			>
				{children}
			</View>
		);
	}

	return (
		<ScrollView
			contentContainerStyle={[
				styles.screenScroll,
				{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 96 },
			]}
			keyboardShouldPersistTaps="handled"
			showsVerticalScrollIndicator={false}
			style={styles.scrollRoot}
		>
			{children}
		</ScrollView>
	);
}

interface HeaderProps {
	backLabel?: string;
	onBack?: () => void;
	right?: React.ReactNode;
	subtitle?: string;
	title: string;
}

export function ScreenHeader({
	title,
	subtitle,
	onBack,
	backLabel,
	right,
}: HeaderProps) {
	const { locale, t } = useI18n();
	const resolvedBackLabel = backLabel
		? translateServiceText(locale, backLabel)
		: t("common.back");

	return (
		<View style={styles.header}>
			<View style={styles.headerTop}>
				{onBack ? (
					<Pressable
						accessibilityLabel={resolvedBackLabel}
						accessibilityRole="button"
						onPress={onBack}
						style={styles.backButton}
					>
						<Ionicons color={colors.blueLight} name="chevron-back" size={16} />
						<Text style={styles.backText}>{resolvedBackLabel}</Text>
					</Pressable>
				) : (
					<View />
				)}
				{right}
			</View>
			<Text style={styles.title}>{translateServiceText(locale, title)}</Text>
			{subtitle ? (
				<Text style={styles.subtitle}>
					{translateServiceText(locale, subtitle)}
				</Text>
			) : null}
		</View>
	);
}

export function BrandHeader() {
	const { t } = useI18n();

	return (
		<View style={styles.brandHeader}>
			<View style={styles.logoMark}>
				<Text style={styles.logoMarkText}>u</Text>
			</View>
			<View>
				<Text style={styles.logoText}>
					<Text style={styles.logoAccent}>u</Text>tiliti
				</Text>
				<Text style={styles.logoSub}>{t("native.fieldServicePlatform")}</Text>
			</View>
		</View>
	);
}

export function ShiftStatus() {
	const { locale, t } = useI18n();

	return (
		<View style={styles.shiftStatus}>
			<View style={styles.statusLeft}>
				<View style={[styles.dot, { backgroundColor: colors.green }]} />
				<View>
					<Text style={styles.statusTitle}>{t("native.shiftActive")}</Text>
					<Text style={styles.statusSub}>
						{translateServiceText(locale, "Clocked in 08:23")}
					</Text>
				</View>
			</View>
			<Text style={styles.statusTime}>1h 18m</Text>
		</View>
	);
}

export function Card({
	children,
	style,
}: PropsWithChildren<{ style?: object }>) {
	return <View style={[styles.card, style]}>{children}</View>;
}

interface SectionLabelProps {
	children: ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
	const { locale } = useI18n();

	return (
		<Text style={styles.sectionLabel}>
			{typeof children === "string"
				? translateServiceText(locale, children)
				: children}
		</Text>
	);
}

interface BadgeProps {
	children: ReactNode;
	tone?: Tone;
}

export function Badge({ children, tone = "muted" }: BadgeProps) {
	const toneStyle = getToneStyle(tone);
	const { locale } = useI18n();

	return (
		<View
			style={[styles.badge, { backgroundColor: toneStyle.backgroundColor }]}
		>
			<Text style={[styles.badgeText, { color: toneStyle.color }]}>
				{typeof children === "string"
					? translateServiceText(locale, children)
					: children}
			</Text>
		</View>
	);
}

interface InfoRowProps {
	isLast?: boolean;
	label: string;
	tone?: Tone;
	value: string;
}

export function InfoRow({
	label,
	value,
	tone = "muted",
	isLast,
}: InfoRowProps) {
	const toneStyle = getToneStyle(tone);
	const { locale } = useI18n();
	return (
		<View style={[styles.infoRow, isLast ? styles.infoRowLast : undefined]}>
			<Text style={styles.infoKey}>{translateServiceText(locale, label)}</Text>
			<Text style={[styles.infoValue, { color: toneStyle.color }]}>
				{translateServiceText(locale, value)}
			</Text>
		</View>
	);
}

interface ActionButtonProps {
	disabled?: boolean;
	icon?: IconName;
	label: string;
	onPress: () => void;
	tone?: Tone;
}

export function ActionButton({
	label,
	onPress,
	tone = "blue",
	icon,
	disabled,
}: ActionButtonProps) {
	const toneStyle = getToneStyle(tone);
	const { locale } = useI18n();
	const getOpacity = (pressed: boolean) => {
		if (disabled) {
			return 0.45;
		}
		if (pressed) {
			return 0.82;
		}
		return 1;
	};
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ disabled: Boolean(disabled) }}
			disabled={disabled}
			onPress={onPress}
			style={({ pressed }) => [
				styles.actionButton,
				{
					backgroundColor: toneStyle.backgroundColor,
					borderColor: toneStyle.borderColor,
					opacity: getOpacity(pressed),
				},
			]}
		>
			{icon ? <Ionicons color={toneStyle.color} name={icon} size={16} /> : null}
			<Text style={[styles.actionText, { color: toneStyle.color }]}>
				{translateServiceText(locale, label)}
			</Text>
		</Pressable>
	);
}

interface GhostButtonProps {
	icon?: IconName;
	label: string;
	onPress: () => void;
}

export function GhostButton({ label, onPress, icon }: GhostButtonProps) {
	const { locale } = useI18n();

	return (
		<Pressable
			accessibilityRole="button"
			onPress={onPress}
			style={({ pressed }) => [
				styles.ghostButton,
				pressed ? styles.pressed : null,
			]}
		>
			{icon ? <Ionicons color={colors.text2} name={icon} size={15} /> : null}
			<Text style={styles.ghostText}>
				{translateServiceText(locale, label)}
			</Text>
		</Pressable>
	);
}

interface SelectOptionProps {
	label: string;
	onPress: () => void;
	selected: boolean;
	tone?: Tone;
}

export function SelectOption({
	label,
	selected,
	onPress,
	tone = "blue",
}: SelectOptionProps) {
	const toneStyle = getToneStyle(tone);
	const { locale } = useI18n();

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ selected }}
			onPress={onPress}
			style={({ pressed }) => [
				styles.selectOption,
				selected
					? {
							backgroundColor: toneStyle.backgroundColor,
							borderColor: toneStyle.borderColor,
						}
					: null,
				pressed ? styles.pressed : null,
			]}
		>
			<Text
				style={[
					styles.selectOptionText,
					{ color: selected ? toneStyle.color : colors.text2 },
				]}
			>
				{translateServiceText(locale, label)}
			</Text>
		</Pressable>
	);
}

interface TextFieldProps extends TextInputProps {
	label: string;
}

export function TextField({
	label,
	multiline,
	style,
	value,
	...props
}: TextFieldProps) {
	const { locale } = useI18n();
	const localizedPlaceholder =
		typeof props.placeholder === "string"
			? translateServiceText(locale, props.placeholder)
			: props.placeholder;
	const localizedValue =
		typeof value === "string" ? translateServiceText(locale, value) : value;

	return (
		<View style={styles.fieldWrap}>
			<Text style={styles.fieldLabel}>
				{translateServiceText(locale, label)}
			</Text>
			<TextInput
				multiline={multiline}
				placeholderTextColor={colors.text3}
				style={[
					styles.input,
					multiline ? styles.inputMultiline : undefined,
					style,
				]}
				{...props}
				placeholder={localizedPlaceholder}
				value={localizedValue}
			/>
		</View>
	);
}

interface MetricProps {
	label: string;
	tone?: Tone;
	value: string;
}

export function Metric({ label, value, tone = "blue" }: MetricProps) {
	const toneStyle = getToneStyle(tone);
	const { locale } = useI18n();

	return (
		<Card style={styles.metricCard}>
			<Text style={[styles.metricValue, { color: toneStyle.color }]}>
				{translateServiceText(locale, value)}
			</Text>
			<Text style={styles.metricLabel}>
				{translateServiceText(locale, label)}
			</Text>
		</Card>
	);
}

interface RowButtonProps {
	icon: IconName;
	onPress: () => void;
	subtitle: string;
	title: string;
	tone?: Tone;
}

export function RowButton({
	title,
	subtitle,
	icon,
	tone = "blue",
	onPress,
}: RowButtonProps) {
	const toneStyle = getToneStyle(tone);
	const { locale } = useI18n();

	return (
		<Pressable
			accessibilityRole="button"
			onPress={onPress}
			style={({ pressed }) => [
				styles.rowButton,
				pressed ? styles.pressed : null,
			]}
		>
			<View
				style={[
					styles.rowIcon,
					{
						backgroundColor: toneStyle.backgroundColor,
						borderColor: toneStyle.borderColor,
					},
				]}
			>
				<Ionicons color={toneStyle.color} name={icon} size={18} />
			</View>
			<View style={styles.rowTextWrap}>
				<Text style={styles.rowTitle}>
					{translateServiceText(locale, title)}
				</Text>
				<Text style={styles.rowSubtitle}>
					{translateServiceText(locale, subtitle)}
				</Text>
			</View>
			<Ionicons color={colors.text3} name="chevron-forward" size={18} />
		</Pressable>
	);
}

export function Divider() {
	return <View style={styles.divider} />;
}

export function jobTone(type: JobType): Tone {
	if (type === "urgent") {
		return "red";
	}
	if (type === "preventive-maintenance") {
		return "teal";
	}
	if (type === "installation") {
		return "amber";
	}
	return "blue";
}

export function jobTypeLabel(type: JobType): string {
	if (type === "preventive-maintenance") {
		return "Preventive Maintenance";
	}
	if (type === "installation") {
		return "Installation";
	}
	if (type === "urgent") {
		return "Urgent";
	}
	return "Repair";
}

export function useJobTypeLabel() {
	const { locale } = useI18n();

	return (type: JobType) => translateServiceText(locale, jobTypeLabel(type));
}

export function statusTone(status: JobStatus): Tone {
	if (status === "active") {
		return "green";
	}
	if (status === "paused") {
		return "amber";
	}
	if (status === "complete") {
		return "green";
	}
	return "blue";
}

export function partStatusLabel(status: PartStatus): string {
	return status === "in-contract" ? "In contract" : "Billable";
}

export function usePartStatusLabel() {
	const { locale } = useI18n();

	return (status: PartStatus) =>
		translateServiceText(locale, partStatusLabel(status));
}

function getToneStyle(tone: Tone) {
	if (tone === "green") {
		return {
			backgroundColor: colors.greenDim,
			borderColor: "rgba(52,201,126,0.28)",
			color: colors.green,
		};
	}
	if (tone === "amber") {
		return {
			backgroundColor: colors.amberDim,
			borderColor: "rgba(245,166,35,0.28)",
			color: colors.amber,
		};
	}
	if (tone === "red") {
		return {
			backgroundColor: colors.redDim,
			borderColor: "rgba(240,81,75,0.28)",
			color: colors.red,
		};
	}
	if (tone === "purple") {
		return {
			backgroundColor: colors.purpleDim,
			borderColor: "rgba(139,92,246,0.28)",
			color: colors.purple,
		};
	}
	if (tone === "teal") {
		return {
			backgroundColor: colors.tealDim,
			borderColor: "rgba(20,184,166,0.28)",
			color: colors.teal,
		};
	}
	if (tone === "muted") {
		return {
			backgroundColor: colors.surface3,
			borderColor: colors.border2,
			color: colors.text2,
		};
	}
	return {
		backgroundColor: colors.blueGlow,
		borderColor: "rgba(43,142,240,0.36)",
		color: colors.blueLight,
	};
}

export const styles = StyleSheet.create({
	actionButton: {
		alignItems: "center",
		borderRadius: 12,
		borderWidth: 1,
		flexDirection: "row",
		gap: 8,
		justifyContent: "center",
		marginTop: 10,
		minHeight: 48,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	actionText: {
		fontSize: 14,
		fontWeight: "700",
	},
	backButton: {
		alignItems: "center",
		flexDirection: "row",
		gap: 2,
		marginLeft: -4,
		minHeight: 32,
	},
	backText: {
		color: colors.blueLight,
		fontSize: 12,
		fontWeight: "700",
	},
	badge: {
		alignSelf: "flex-start",
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	badgeText: {
		fontSize: 10,
		fontWeight: "800",
		letterSpacing: 0.4,
		textTransform: "uppercase",
	},
	brandHeader: {
		alignItems: "center",
		flexDirection: "row",
		gap: 12,
		marginBottom: 20,
	},
	card: {
		backgroundColor: colors.surface2,
		borderColor: colors.border,
		borderRadius: 14,
		borderWidth: 1,
		marginBottom: 10,
		padding: 14,
	},
	divider: {
		backgroundColor: colors.border,
		height: 1,
		marginVertical: 14,
	},
	dot: {
		borderRadius: 4,
		height: 8,
		width: 8,
	},
	fieldLabel: {
		color: colors.text2,
		fontSize: 12,
		fontWeight: "600",
		marginBottom: 6,
	},
	fieldWrap: {
		marginBottom: 10,
	},
	ghostButton: {
		alignItems: "center",
		borderColor: colors.border,
		borderRadius: 10,
		borderWidth: 1,
		flexDirection: "row",
		gap: 7,
		justifyContent: "center",
		minHeight: 42,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	ghostText: {
		color: colors.text2,
		fontSize: 13,
		fontWeight: "700",
	},
	header: {
		marginBottom: 14,
	},
	headerTop: {
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "space-between",
		minHeight: 32,
	},
	infoKey: {
		color: colors.text2,
		fontSize: 12,
	},
	infoRow: {
		alignItems: "flex-start",
		borderBottomColor: colors.border,
		borderBottomWidth: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 9,
	},
	infoRowLast: {
		borderBottomWidth: 0,
		paddingBottom: 0,
	},
	infoValue: {
		flexShrink: 1,
		fontSize: 12,
		fontWeight: "700",
		maxWidth: "58%",
		textAlign: "right",
	},
	input: {
		backgroundColor: colors.surface3,
		borderColor: colors.border,
		borderRadius: 10,
		borderWidth: 1,
		color: colors.text,
		fontSize: 14,
		minHeight: 44,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	inputMultiline: {
		minHeight: 92,
		textAlignVertical: "top",
	},
	logoAccent: {
		color: colors.blue,
	},
	logoMark: {
		alignItems: "center",
		backgroundColor: "#1c2540",
		borderColor: colors.border2,
		borderRadius: 14,
		borderWidth: 1,
		height: 48,
		justifyContent: "center",
		width: 48,
	},
	logoMarkText: {
		color: colors.blue,
		fontSize: 22,
		fontWeight: "800",
	},
	logoSub: {
		color: colors.text3,
		fontSize: 12,
		marginTop: 2,
	},
	logoText: {
		color: colors.text,
		fontSize: 22,
		fontWeight: "800",
	},
	metricCard: {
		flex: 1,
		marginBottom: 0,
		minHeight: 82,
	},
	metricLabel: {
		color: colors.text2,
		fontSize: 11,
		marginTop: 5,
	},
	metricValue: {
		fontSize: 22,
		fontWeight: "800",
	},
	pressed: {
		opacity: 0.72,
	},
	rowButton: {
		alignItems: "center",
		backgroundColor: colors.surface2,
		borderBottomColor: colors.border,
		borderBottomWidth: 1,
		flexDirection: "row",
		gap: 12,
		paddingHorizontal: 12,
		paddingVertical: 13,
	},
	rowIcon: {
		alignItems: "center",
		borderRadius: 10,
		borderWidth: 1,
		height: 36,
		justifyContent: "center",
		width: 36,
	},
	rowSubtitle: {
		color: colors.text2,
		fontSize: 12,
		marginTop: 2,
	},
	rowTextWrap: {
		flex: 1,
	},
	rowTitle: {
		color: colors.text,
		fontSize: 14,
		fontWeight: "700",
	},
	screen: {
		backgroundColor: colors.bg,
		flex: 1,
		paddingHorizontal: 18,
	},
	screenScroll: {
		backgroundColor: colors.bg,
		flexGrow: 1,
		paddingHorizontal: 18,
	},
	scrollRoot: {
		backgroundColor: colors.bg,
		flex: 1,
	},
	sectionLabel: {
		color: colors.text3,
		fontSize: 11,
		fontWeight: "800",
		letterSpacing: 0.8,
		marginBottom: 8,
		marginTop: 8,
		textTransform: "uppercase",
	},
	selectOption: {
		alignItems: "center",
		backgroundColor: colors.surface2,
		borderColor: colors.border,
		borderRadius: 10,
		borderWidth: 1,
		flex: 1,
		justifyContent: "center",
		minHeight: 46,
		paddingHorizontal: 10,
		paddingVertical: 10,
	},
	selectOptionText: {
		fontSize: 12,
		fontWeight: "800",
		textAlign: "center",
	},
	shiftStatus: {
		alignItems: "center",
		backgroundColor: "rgba(52,201,126,0.10)",
		borderColor: "rgba(52,201,126,0.25)",
		borderRadius: 12,
		borderWidth: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 14,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	statusLeft: {
		alignItems: "center",
		flexDirection: "row",
		gap: 9,
	},
	statusSub: {
		color: colors.text2,
		fontSize: 11,
		marginTop: 2,
	},
	statusTime: {
		color: colors.blueLight,
		fontSize: 13,
		fontWeight: "800",
	},
	statusTitle: {
		color: colors.green,
		fontSize: 12,
		fontWeight: "800",
	},
	subtitle: {
		color: colors.text2,
		fontSize: 13,
		lineHeight: 19,
		marginTop: 4,
	},
	title: {
		color: colors.text,
		fontSize: 26,
		fontWeight: "800",
		letterSpacing: -0.4,
	},
});
