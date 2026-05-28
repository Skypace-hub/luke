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
import { PasswordInput } from "@/components/password-input";
import { authClient } from "@/lib/auth-client";
import { getAuthError } from "@/lib/business-errors";

import Loader from "./loader";

const authInputClass =
	"h-10 rounded-none border-0 border-b border-input bg-transparent px-0 shadow-none focus-visible:border-ring focus-visible:ring-0";
const authLabelClass = "font-medium text-muted-foreground text-xs";
const authLinkClass =
	"font-semibold text-primary outline-none underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring/40";
const authSubmitClass = "h-10 min-w-32 bg-primary px-6";

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
		<AuthShell variant="sign-in">
			<AuthCard
				description={
					<span>
						New user?{" "}
						<button
							className={authLinkClass}
							onClick={onSwitchToSignUp}
							type="button"
						>
							Create an account
						</button>
					</span>
				}
				title="Sign in"
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
						{(field) => (
							<div className="flex flex-col gap-1">
								<Label className={authLabelClass} htmlFor={field.name}>
									Email address
								</Label>
								<Input
									autoComplete="username"
									className={authInputClass}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="name@company.com"
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
							<div className="flex flex-col gap-1">
								<Label className={authLabelClass} htmlFor={field.name}>
									Password
								</Label>
								<PasswordInput
									autoComplete="current-password"
									className={`${authInputClass} pr-11`}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="Enter password"
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

					<div className="flex justify-end pt-1">
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
									{isSubmitting ? "Submitting..." : "Sign In"}
								</Button>
							)}
						</form.Subscribe>
					</div>
				</form>

				<div className="mt-10 border-t pt-6">
					<p className="text-muted-foreground text-xs leading-relaxed">
						Protected by Utiliti workspace security. Access is limited to
						authorized service operations users.
					</p>
				</div>
			</AuthCard>
		</AuthShell>
	);
}
