import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button, Surface, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { useI18n } from "@/contexts/i18n-context";

function Modal() {
	const { t } = useI18n();
	const accentForegroundColor = useThemeColor("accent-foreground");

	function handleClose() {
		router.back();
	}

	return (
		<Container>
			<View className="flex-1 items-center justify-center p-4">
				<Surface className="w-full max-w-sm rounded-lg p-5" variant="secondary">
					<View className="items-center">
						<View className="mb-3 h-12 w-12 items-center justify-center rounded-lg bg-accent">
							<Ionicons
								color={accentForegroundColor}
								name="checkmark"
								size={24}
							/>
						</View>
						<Text className="mb-1 font-medium text-foreground text-lg">
							{t("native.modalScreen")}
						</Text>
						<Text className="mb-4 text-center text-muted text-sm">
							{t("native.modalDescription")}
						</Text>
					</View>
					<Button className="w-full" onPress={handleClose} size="sm">
						<Button.Label>{t("common.close")}</Button.Label>
					</Button>
				</Surface>
			</View>
		</Container>
	);
}

export default Modal;
