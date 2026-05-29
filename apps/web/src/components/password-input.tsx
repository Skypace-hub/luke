"use client";

import { Button } from "@luke/ui/components/button";
import { Input } from "@luke/ui/components/input";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const Icon = isPasswordVisible ? EyeOffIcon : EyeIcon;

	return (
		<div className="relative">
			<Input
				className={className}
				type={isPasswordVisible ? "text" : "password"}
				{...props}
			/>
			<Button
				aria-label={isPasswordVisible ? "Hide password" : "Show password"}
				className="absolute top-1/2 right-2 size-8 -translate-y-1/2 rounded-lg text-muted-foreground hover:text-foreground"
				onClick={() => setIsPasswordVisible((current) => !current)}
				size="icon"
				title={isPasswordVisible ? "Hide password" : "Show password"}
				type="button"
				variant="ghost"
			>
				<Icon />
			</Button>
		</div>
	);
}
