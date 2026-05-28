import "@luke/env/web";
import type { NextConfig } from "next";

const configuredDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

const nextConfig: NextConfig = {
	allowedDevOrigins:
		configuredDevOrigins && configuredDevOrigins.length > 0
			? configuredDevOrigins
			: ["118.195.131.34"],
	reactCompiler: true,
	typedRoutes: true,
};

export default nextConfig;
