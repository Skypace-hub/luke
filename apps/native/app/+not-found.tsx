import { Link, Stack } from "expo-router";
import { Button, Surface } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { useI18n } from "@/contexts/i18n-context";

export default function NotFoundScreen() {
	const { t } = useI18n();

	return (
		<>
			<Stack.Screen options={{ title: t("native.notFound") }} />
			<Container>
				<View className="flex-1 items-center justify-center p-4">
					<Surface
						className="max-w-sm items-center rounded-lg p-6"
						variant="secondary"
					>
						<Text className="mb-3 text-4xl">🤔</Text>
						<Text className="mb-1 font-medium text-foreground text-lg">
							{t("native.pageNotFound")}
						</Text>
						<Text className="mb-4 text-center text-muted text-sm">
							{t("native.pageNotFoundDescription")}
						</Text>
						<Link asChild href="/">
							<Button size="sm">
								<Button.Label>{t("native.goHome")}</Button.Label>
							</Button>
						</Link>
					</Surface>
				</View>
			</Container>
		</>
	);
}
