import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	// Exclude server-only packages from bundling (pino uses worker threads)
	serverExternalPackages: [
		"pino",
		"pino-pretty",
		"thread-stream",
		"sonic-boom",
	],

	// Experimental features
	experimental: {
		// Enable server actions
		serverActions: {
			bodySizeLimit: "2mb",
		},
		viewTransition: true,
	},
	devIndicators: false,
}

export default nextConfig
