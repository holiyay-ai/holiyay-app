import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Enable standalone output only when running in Docker
  ...(() => {
   // Respect an explicit env var if present
   const envDocker =
    process.env.DOCKER === "true" ||
    process.env.DOCKER === "1" ||
    process.env.IS_DOCKER === "true" ||
    process.env.IS_DOCKER === "1";

   let isDocker = !!envDocker;

   if (!isDocker) {
    try {
     // Dynamically require fs so we don't add a top-level import
     const fs = require("node:fs");

     // Common Docker indicator file
     if (fs.existsSync("/.dockerenv")) {
      isDocker = true;
     } else if (fs.existsSync("/proc/1/cgroup")) {
      const cgroup = fs.readFileSync("/proc/1/cgroup", "utf8");
      if (/docker|kubepods|containerd/.test(cgroup)) {
       isDocker = true;
      }
     }
    } catch {
     // Ignore and fall back to environment variable only
    }
   }

   return isDocker ? { output: "standalone" } : {};
  })(),

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
