import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	// Enable standalone output for Docker deployments
	output: "standalone",

	// Transpile the API package for use in route handlers
	transpilePackages: ["@holiyay/api"],

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

	// Turbopack configuration to resolve @holiyay/api's path aliases
	turbopack: {
		resolveAlias: {
			// Map ~/* imports from @holiyay/api to the actual src directory
			// Using ~/ prefix to avoid conflict with web package's @/ alias
			"~/app": "../api/src/app",
			"~/app.ts": "../api/src/app.ts",
			"~/config": "../api/src/config",
			"~/config/*": "../api/src/config/*",
			"~/db": "../api/src/db",
			"~/db/*": "../api/src/db/*",
			"~/external": "../api/src/external",
			"~/external/*": "../api/src/external/*",
			"~/lib": "../api/src/lib",
			"~/lib/*": "../api/src/lib/*",
			"~/middleware": "../api/src/middleware",
			"~/middleware/*": "../api/src/middleware/*",
			"~/repositories": "../api/src/repositories",
			"~/repositories/*": "../api/src/repositories/*",
			"~/routes": "../api/src/routes",
			"~/routes/*": "../api/src/routes/*",
			"~/services": "../api/src/services",
			"~/services/*": "../api/src/services/*",
			"~/types": "../api/src/types",
			"~/types/*": "../api/src/types/*",
		},
	},
}

export default nextConfig
