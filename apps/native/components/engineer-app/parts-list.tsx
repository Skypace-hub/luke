import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { EngineerPart } from "@/lib/engineer-app-data";

import { colors, partStatusLabel } from "./engineer-ui";

interface PartsListProps {
	onChangeQuantity?: (partId: string, quantity: number) => void;
	onTogglePart?: (partId: string) => void;
	parts: EngineerPart[];
	quantities: Record<string, number>;
	selectable?: boolean;
	selectedPartIds?: Set<string>;
}

export function PartsList({
	parts,
	quantities,
	onChangeQuantity,
	selectable,
	selectedPartIds,
	onTogglePart,
}: PartsListProps) {
	return (
		<View
			style={{
				backgroundColor: colors.surface2,
				borderColor: colors.border,
				borderRadius: 14,
				borderWidth: 1,
				overflow: "hidden",
			}}
		>
			{parts.map((part, index) => {
				const isLast = index === parts.length - 1;
				const quantity = quantities[part.id] ?? 0;
				const isSelected = selectedPartIds?.has(part.id) ?? false;
				const statusColor =
					part.status === "in-contract" ? colors.green : colors.amber;
				return (
					<View
						key={part.id}
						style={{
							alignItems: "center",
							borderBottomColor: colors.border,
							borderBottomWidth: isLast ? 0 : 1,
							flexDirection: "row",
							gap: 12,
							justifyContent: "space-between",
							paddingHorizontal: 12,
							paddingVertical: 12,
						}}
					>
						<View style={{ flex: 1 }}>
							<Text
								style={{
									color: colors.text,
									fontSize: 14,
									fontWeight: "700",
								}}
							>
								{part.name}
							</Text>
							<Text
								style={{
									color: statusColor,
									fontSize: 11,
									marginTop: 3,
								}}
							>
								P/N: {part.partNumber} · {partStatusLabel(part.status)}
							</Text>
						</View>
						{selectable ? (
							<Pressable
								accessibilityLabel={`${isSelected ? "Unselect" : "Select"} ${
									part.name
								}`}
								accessibilityRole="checkbox"
								accessibilityState={{ checked: isSelected }}
								onPress={() => onTogglePart?.(part.id)}
								style={{
									alignItems: "center",
									backgroundColor: isSelected ? colors.blue : "transparent",
									borderColor: isSelected ? colors.blue : colors.border2,
									borderRadius: 6,
									borderWidth: 1.5,
									height: 24,
									justifyContent: "center",
									width: 24,
								}}
							>
								{isSelected ? (
									<Ionicons color={colors.white} name="checkmark" size={15} />
								) : null}
							</Pressable>
						) : (
							<View
								style={{
									alignItems: "center",
									flexDirection: "row",
									gap: 6,
								}}
							>
								<QuantityButton
									label="Decrease quantity"
									onPress={() =>
										onChangeQuantity?.(part.id, Math.max(0, quantity - 1))
									}
									symbol="remove"
								/>
								<Text
									style={{
										color: colors.text,
										fontSize: 14,
										fontWeight: "800",
										minWidth: 18,
										textAlign: "center",
									}}
								>
									{quantity}
								</Text>
								<QuantityButton
									label="Increase quantity"
									onPress={() => onChangeQuantity?.(part.id, quantity + 1)}
									symbol="add"
								/>
							</View>
						)}
					</View>
				);
			})}
		</View>
	);
}

interface QuantityButtonProps {
	label: string;
	onPress: () => void;
	symbol: "add" | "remove";
}

function QuantityButton({ label, onPress, symbol }: QuantityButtonProps) {
	return (
		<Pressable
			accessibilityLabel={label}
			accessibilityRole="button"
			onPress={onPress}
			style={({ pressed }) => ({
				alignItems: "center",
				backgroundColor: colors.surface3,
				borderColor: colors.border,
				borderRadius: 7,
				borderWidth: 1,
				height: 28,
				justifyContent: "center",
				opacity: pressed ? 0.72 : 1,
				width: 28,
			})}
		>
			<Ionicons color={colors.text} name={symbol} size={16} />
		</Pressable>
	);
}
