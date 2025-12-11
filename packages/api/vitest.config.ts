import path from "node:path"
import { defineConfig } from "vitest/config"

/**
 * Vitest config for @holiyay/api
 *
 * - Runs tests in a Node environment (the API is server-side code)
 * - Adds a Vite resolve alias so imports like `~/config` or `~/db` resolve to `./src/*`
 */
export default defineConfig({
	test: {
		// Use the Node environment (not the browser)
		environment: "node",

		// Include test files in the `test/` folder
		include: ["test/**/*.test.ts", "test/**/*.spec.ts", "test/**/*.ts"],

		// Keep globals false since tests import from 'vitest' explicitly
		globals: false,
	},

	// Ensure Vite (and therefore Vitest) resolves `~/*` imports to the package `src` dir
	resolve: {
		alias: [
			// Matches imports like `~/foo/bar` and replaces with `<package-root>/src/foo/bar`
			{
				find: /^~\/(.*)$/,
				replacement: `${path.resolve(__dirname, "src")}/$1`,
			},
			// Also allow `~` -> `src` if code imports exactly `~`
			{
				find: "~",
				replacement: path.resolve(__dirname, "src"),
			},
		],
	},
})
