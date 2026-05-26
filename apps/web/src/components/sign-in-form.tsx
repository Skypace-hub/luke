import { normalizeSignInEmail } from "@luke/auth/default-admin";
import { Button } from "@luke/ui/components/button";
import { Input } from "@luke/ui/components/input";
import { Label } from "@luke/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import { AuthCard, AuthShell } from "@/components/auth-shell";
import { authClient } from "@/lib/auth-client";
import { getAuthError } from "@/lib/business-errors";

import Loader from "./loader";

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const router = useRouter();
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
						toast.success("Sign in successful");
					},
					onError: (error) => {
						const businessError = getAuthError({
							action: "sign-in",
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
				email: z.string().trim().min(1, "Email or username is required"),
				password: z.string().min(1, "Password is required"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<AuthShell>
			<AuthCard
				description="Sign in to manage service operations, jobs, assets, and tenant controls."
				title="Welcome back"
			>
				<form
					className="flex flex-col gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						form.handleSubmit();
					}}
				>
					<form.Field name="email">
						{(field) => (
							<div className="flex flex-col gap-2">
								<Label htmlFor={field.name}>Email or username</Label>
								<Input
									autoComplete="username"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									type="text"
									value={field.state.value}
								/>
								{field.state.meta.errors.map((error) => (
									<p className="text-destructive text-xs" key={error?.message}>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>

					<form.Field name="password">
						{(field) => (
							<div className="flex flex-col gap-2">
								<Label htmlFor={field.name}>Password</Label>
								<Input
									autoComplete="current-password"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									type="password"
									value={field.state.value}
								/>
								{field.state.meta.errors.map((error) => (
									<p className="text-destructive text-xs" key={error?.message}>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>

					<form.Subscribe
						selector={(state) => ({
							canSubmit: state.canSubmit,
							isSubmitting: state.isSubmitting,
						})}
					>
						{({ canSubmit, isSubmitting }) => (
							<Button
								className="w-full"
								disabled={!canSubmit || isSubmitting}
								type="submit"
							>
								{isSubmitting ? (
									<Loader2Icon
										className="animate-spin"
										data-icon="inline-start"
									/>
								) : null}
								{isSubmitting ? "Submitting..." : "Sign In"}
							</Button>
						)}
					</form.Subscribe>
				</form>

				<div className="mt-4 text-center">
					<Button onClick={onSwitchToSignUp} variant="link">
						Need an account? Sign Up
					</Button>
				</div>
			</AuthCard>
		</AuthShell>
	);
}
