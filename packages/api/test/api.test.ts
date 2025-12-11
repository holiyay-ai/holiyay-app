import { describe, expect, test } from "vitest"
import app from "../src/app"

describe("Holiyay API", () => {
	describe("Health Check", () => {
		test("GET / returns API info", async () => {
			const res = await app.request("/")

			expect(res.status).toBe(200)

			const data = (await res.json()) as { name: string; status: string }
			expect(data.name).toBe("Holiyay API")
			expect(data.status).toBe("ok")
		})

		test("GET /health returns health status", async () => {
			const res = await app.request("/health")

			expect(res.status).toBe(200)

			const data = (await res.json()) as {
				status: string
				timestamp: string
				services: { database: unknown }
			}
			// Status can be "ok" (with DB) or "degraded" (without DB)
			expect(["ok", "degraded"]).toContain(data.status)
			expect(data.timestamp).toBeDefined()
			expect(data.services).toBeDefined()
			expect(data.services.database).toBeDefined()
		})
	})

	describe("404 Handling", () => {
		test("Returns 404 for unknown top-level routes", async () => {
			const res = await app.request("/completely-unknown")

			expect(res.status).toBe(404)

			const data = (await res.json()) as { error: string }
			expect(data.error).toBe("Not found")
		})
	})

	describe("Auth Routes - Validation", () => {
		test("POST /auth/register rejects empty body", async () => {
			const res = await app.request("/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			})

			expect(res.status).toBe(400)
		})

		test("POST /auth/register rejects invalid email", async () => {
			const res = await app.request("/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: "not-an-email",
					password: "password123",
					name: "Test User",
				}),
			})

			expect(res.status).toBe(400)
		})

		test("POST /auth/register rejects short password", async () => {
			const res = await app.request("/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: "test@example.com",
					password: "short",
					name: "Test User",
				}),
			})

			expect(res.status).toBe(400)
		})

		test("POST /auth/login rejects empty body", async () => {
			const res = await app.request("/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			})

			expect(res.status).toBe(400)
		})

		test("GET /auth/me requires authentication", async () => {
			const res = await app.request("/auth/me")

			expect(res.status).toBe(401)
		})

		test("GET /auth/me rejects invalid token", async () => {
			const res = await app.request("/auth/me", {
				headers: { Authorization: "Bearer invalid-token" },
			})

			expect(res.status).toBe(401)
		})
	})

	describe("Protected Routes - Auth Required", () => {
		test("GET /calendars requires authentication", async () => {
			const res = await app.request("/calendars")

			expect(res.status).toBe(401)
		})

		test("POST /calendars requires authentication", async () => {
			const res = await app.request("/calendars", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Test Trip",
					startDate: "2024-01-01",
					endDate: "2024-01-07",
				}),
			})

			expect(res.status).toBe(401)
		})

		test("POST /ai/checklist requires authentication", async () => {
			const res = await app.request("/ai/checklist", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					destination: "Paris",
					startDate: "2024-01-01",
					endDate: "2024-01-07",
				}),
			})

			expect(res.status).toBe(401)
		})

		test("POST /ai/recommend requires authentication", async () => {
			const res = await app.request("/ai/recommend", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					destination: "Tokyo",
				}),
			})

			expect(res.status).toBe(401)
		})
	})

	describe("CORS", () => {
		test("OPTIONS request returns CORS headers", async () => {
			const res = await app.request("/health", {
				method: "OPTIONS",
				headers: {
					Origin: "http://localhost:3001",
					"Access-Control-Request-Method": "GET",
				},
			})

			expect(res.headers.get("Access-Control-Allow-Origin")).toBeDefined()
			expect(res.headers.get("Access-Control-Allow-Methods")).toBeDefined()
		})
	})
})
