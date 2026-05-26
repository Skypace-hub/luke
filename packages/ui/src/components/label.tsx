import { cn } from "@luke/ui/lib/utils";
import type * as React from "react";

function Label({ className, ...props }: React.ComponentProps<"label">) {
	return (
		// Biome cannot see the htmlFor or nested control passed through this primitive.
		// biome-ignore lint/a11y/noLabelWithoutControl: call sites provide the associated control.
		<label
			className={cn(
				"flex select-none items-center gap-2 text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
				className
			)}
			data-slot="label"
			{...props}
		/>
	);
}

export { Label };
