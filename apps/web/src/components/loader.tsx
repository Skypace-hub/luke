import { Loader2Icon } from "lucide-react";

export default function Loader() {
	return (
		<div
			aria-label="Loading"
			className="flex min-h-svh items-center justify-center bg-background text-muted-foreground"
			role="status"
		>
			<Loader2Icon className="size-6 animate-spin" />
		</div>
	);
}
