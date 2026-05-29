import { normalizeSignInEmail } from "@luke/auth/default-admin";
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

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const router = useRouter();
	const { t } = useI18n();
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: normalizeSignInEmail(value.email),
					password: value.password,
				},
				{
					onSuccess: () => {
						router.push("/dashboard");
						toast.success(t("auth.signInSuccess"));
					},
					onError: (error) => {
						const businessError = getAuthError({
							action: "sign-in",
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
				email: z.string().trim().min(1, t("auth.emailOrUsernameRequired")),
				password: z.string().min(1, t("auth.passwordRequired")),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<AuthShell variant="sign-in">
			<AuthCard
				description={
					<span>
						{t("auth.newUser")}{" "}
						<button
							className={authLinkClass}
							onClick={onSwitchToSignUp}
							type="button"
						>
							{t("auth.switchToSignUp")}
						</button>
					</span>
				}
				title={t("auth.signIn")}
			>
				<form
					className="flex flex-col gap-6"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						form.handleSubmit();
					}}
				>
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
										autoComplete="username"
										className={authInputClass}
										id={field.name}
										name={field.name}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder={t("auth.emailPlaceholder")}
										type="text"
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
										autoComplete="current-password"
										className={authPasswordInputClass}
										id={field.name}
										name={field.name}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder={t("auth.passwordPlaceholder")}
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

					<div className="pt-1">
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
									{isSubmitting ? t("auth.submitting") : t("auth.signInSubmit")}
								</Button>
							)}
						</form.Subscribe>
					</div>
				</form>

				<div className={authFooterClass}>
					<p className={authFinePrintClass}>{t("auth.footer.signIn")}</p>
				</div>
			</AuthCard>
		</AuthShell>
	);
}
