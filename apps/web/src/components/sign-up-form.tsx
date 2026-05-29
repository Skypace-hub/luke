import { Button } from "@luke/ui/components/button";
import { Input } from "@luke/ui/components/input";
import { Label } from "@luke/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import {
	authErrorClass,
	authFieldClass,
	authFinePrintClass,
	authFooterClass,
	authInputClass,
	authLabelClass,
	authLinkClass,
	authPasswordInputClass,
	authSubmitClass,
} from "@/components/auth-form-styles";
import { AuthCard, AuthShell } from "@/components/auth-shell";
import { useI18n } from "@/components/i18n-provider";
import { PasswordInput } from "@/components/password-input";
import { authClient } from "@/lib/auth-client";
import { getAuthError } from "@/lib/business-errors";

import Loader from "./loader";

export default function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const router = useRouter();
	const { t } = useI18n();
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					onSuccess: () => {
						router.push("/dashboard");
						toast.success(t("auth.signUpSuccess"));
					},
					onError: (error) => {
						const businessError = getAuthError({
							action: "sign-up",
							message: error.error.message || error.error.statusText,
							t,
						});

						toast.error(businessError.title, {
							description: businessError.description,
						});
					},
				}
			);
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(2, t("auth.nameMin")),
				email: z.email(t("auth.invalidEmail")),
				password: z.string().min(8, t("auth.passwordMin")),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<AuthShell variant="sign-up">
			<AuthCard
				description={
					<span>
						{t("auth.withAccount")}{" "}
						<button
							className={authLinkClass}
							onClick={onSwitchToSignIn}
							type="button"
						>
							{t("auth.switchToSignIn")}
						</button>
					</span>
				}
				title={t("auth.createAccount")}
			>
				<form
					className="flex flex-col gap-6"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						form.handleSubmit();
					}}
				>
					<form.Field name="name">
						{(field) => {
							const errorMessage = field.state.meta.errors[0]?.message;
							const errorId = `${field.name}-error`;
							const isInvalid = Boolean(errorMessage);

							return (
								<div className={authFieldClass}>
									<Label className={authLabelClass} htmlFor={field.name}>
										{t("auth.name")}
									</Label>
									<Input
										aria-describedby={isInvalid ? errorId : undefined}
										aria-invalid={isInvalid || undefined}
										autoComplete="name"
										className={authInputClass}
										id={field.name}
										name={field.name}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder={t("auth.namePlaceholder")}
										value={field.state.value}
									/>
									{errorMessage ? (
										<p className={authErrorClass} id={errorId}>
											{errorMessage}
										</p>
									) : null}
								</div>
							);
						}}
					</form.Field>

					<form.Field name="email">
						{(field) => {
							const errorMessage = field.state.meta.errors[0]?.message;
							const errorId = `${field.name}-error`;
							const isInvalid = Boolean(errorMessage);

							return (
								<div className={authFieldClass}>
									<Label className={authLabelClass} htmlFor={field.name}>
										{t("auth.emailAddress")}
									</Label>
									<Input
										aria-describedby={isInvalid ? errorId : undefined}
										aria-invalid={isInvalid || undefined}
										autoComplete="email"
										className={authInputClass}
										id={field.name}
										name={field.name}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder={t("auth.emailPlaceholder")}
										type="email"
										value={field.state.value}
									/>
									{errorMessage ? (
										<p className={authErrorClass} id={errorId}>
											{errorMessage}
										</p>
									) : null}
								</div>
							);
						}}
					</form.Field>

					<form.Field name="password">
						{(field) => {
							const errorMessage = field.state.meta.errors[0]?.message;
							const errorId = `${field.name}-error`;
							const isInvalid = Boolean(errorMessage);

							return (
								<div className={authFieldClass}>
									<Label className={authLabelClass} htmlFor={field.name}>
										{t("auth.password")}
									</Label>
									<PasswordInput
										aria-describedby={isInvalid ? errorId : undefined}
										aria-invalid={isInvalid || undefined}
										autoComplete="new-password"
										className={authPasswordInputClass}
										id={field.name}
										name={field.name}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder={t("auth.passwordCreatePlaceholder")}
										value={field.state.value}
									/>
									{errorMessage ? (
										<p className={authErrorClass} id={errorId}>
											{errorMessage}
										</p>
									) : null}
								</div>
							);
						}}
					</form.Field>

					<form.Subscribe
						selector={(state) => ({
							canSubmit: state.canSubmit,
							isSubmitting: state.isSubmitting,
						})}
					>
						{({ canSubmit, isSubmitting }) => (
							<Button
								className={authSubmitClass}
								disabled={!canSubmit || isSubmitting}
								type="submit"
							>
								{isSubmitting ? (
									<Loader2Icon
										className="animate-spin"
										data-icon="inline-start"
									/>
								) : null}
								{isSubmitting
									? t("auth.submitting")
									: t("auth.createAccountSubmit")}
							</Button>
						)}
					</form.Subscribe>
				</form>

				<div className={authFooterClass}>
					<p className={authFinePrintClass}>{t("auth.footer.signUp")}</p>
				</div>
			</AuthCard>
		</AuthShell>
	);
}
