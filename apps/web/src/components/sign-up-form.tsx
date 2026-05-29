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
						toast.success("Sign up successful");
					},
					onError: (error) => {
						const businessError = getAuthError({
							action: "sign-up",
							message: error.error.message || error.error.statusText,
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
				name: z.string().min(2, "Name must be at least 2 characters"),
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
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
						Already have an account?{" "}
						<button
							className={authLinkClass}
							onClick={onSwitchToSignIn}
							type="button"
						>
							Sign in
						</button>
					</span>
				}
				title="Create account"
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
										Name
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
										placeholder="Your full name"
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
										Email address
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
										placeholder="name@company.com"
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
										Password
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
										placeholder="Create a password"
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
								{isSubmitting ? "Submitting..." : "Sign Up"}
							</Button>
						)}
					</form.Subscribe>
				</form>

				<div className={authFooterClass}>
					<p className={authFinePrintClass}>
						By creating an account, your workspace can manage tenant service
						data under your organization&apos;s access controls.
					</p>
				</div>
			</AuthCard>
		</AuthShell>
	);
}
