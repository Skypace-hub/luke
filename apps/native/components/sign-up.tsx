import { useForm } from "@tanstack/react-form";
import {
	Button,
	FieldError,
	Input,
	Label,
	Spinner,
	Surface,
	TextField,
	useToast,
} from "heroui-native";
import { useRef } from "react";
import { Text, type TextInput, View } from "react-native";
import z from "zod";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/contexts/i18n-context";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

const getSignUpSchema = (t: ReturnType<typeof useI18n>["t"]) =>
	z.object({
		name: z
			.string()
			.trim()
			.min(1, t("native.nameRequired"))
			.min(2, t("auth.nameMin")),
		email: z
			.string()
			.trim()
			.min(1, t("native.emailRequired"))
			.email(t("native.enterValidEmail")),
		password: z
			.string()
			.min(1, t("native.passwordRequired"))
			.min(8, t("native.useAtLeast8")),
	});

function getErrorMessage(error: unknown): string | null {
	if (!error) {
		return null;
	}

	if (typeof error === "string") {
		return error;
	}

	if (Array.isArray(error)) {
		for (const issue of error) {
			const message = getErrorMessage(issue);
			if (message) {
				return message;
			}
		}
		return null;
	}

	if (typeof error === "object" && error !== null) {
		const maybeError = error as { message?: unknown };
		if (typeof maybeError.message === "string") {
			return maybeError.message;
		}
	}

	return null;
}

export function SignUp() {
	const { t } = useI18n();
	const emailInputRef = useRef<TextInput>(null);
	const passwordInputRef = useRef<TextInput>(null);
	const { toast } = useToast();

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
		validators: {
			onSubmit: getSignUpSchema(t),
		},
		onSubmit: async ({ value, formApi }) => {
			await authClient.signUp.email(
				{
					name: value.name.trim(),
					email: value.email.trim(),
					password: value.password,
				},
				{
					onError(error) {
						toast.show({
							variant: "danger",
							label: error.error?.message || t("native.failedSignUp"),
						});
					},
					onSuccess() {
						formApi.reset();
						toast.show({
							variant: "success",
							label: t("native.accountCreated"),
						});
						queryClient.refetchQueries();
					},
				}
			);
		},
	});

	return (
		<Surface className="rounded-lg p-4" variant="secondary">
			<View className="mb-4 flex-row items-center justify-between">
				<Text className="font-medium text-foreground">
					{t("native.createAccount")}
				</Text>
				<LanguageSwitcher />
			</View>

			<form.Subscribe
				selector={(state) => ({
					isSubmitting: state.isSubmitting,
					validationError: getErrorMessage(state.errorMap.onSubmit),
				})}
			>
				{({ isSubmitting, validationError }) => {
					const formError = validationError;

					return (
						<>
							<FieldError className="mb-3" isInvalid={!!formError}>
								{formError}
							</FieldError>

							<View className="gap-3">
								<form.Field name="name">
									{(field) => (
										<TextField>
											<Label>{t("auth.name")}</Label>
											<Input
												autoComplete="name"
												blurOnSubmit={false}
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												onSubmitEditing={() => {
													emailInputRef.current?.focus();
												}}
												placeholder="John Doe"
												returnKeyType="next"
												textContentType="name"
												value={field.state.value}
											/>
										</TextField>
									)}
								</form.Field>

								<form.Field name="email">
									{(field) => (
										<TextField>
											<Label>{t("native.email")}</Label>
											<Input
												autoCapitalize="none"
												autoComplete="email"
												blurOnSubmit={false}
												keyboardType="email-address"
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												onSubmitEditing={() => {
													passwordInputRef.current?.focus();
												}}
												placeholder="email@example.com"
												ref={emailInputRef}
												returnKeyType="next"
												textContentType="emailAddress"
												value={field.state.value}
											/>
										</TextField>
									)}
								</form.Field>

								<form.Field name="password">
									{(field) => (
										<TextField>
											<Label>{t("auth.password")}</Label>
											<Input
												autoComplete="new-password"
												onBlur={field.handleBlur}
												onChangeText={field.handleChange}
												onSubmitEditing={form.handleSubmit}
												placeholder="••••••••"
												ref={passwordInputRef}
												returnKeyType="go"
												secureTextEntry
												textContentType="newPassword"
												value={field.state.value}
											/>
										</TextField>
									)}
								</form.Field>

								<Button
									className="mt-1"
									isDisabled={isSubmitting}
									onPress={form.handleSubmit}
								>
									{isSubmitting ? (
										<Spinner color="default" size="sm" />
									) : (
										<Button.Label>{t("native.createAccount")}</Button.Label>
									)}
								</Button>
							</View>
						</>
					);
				}}
			</form.Subscribe>
		</Surface>
	);
}
