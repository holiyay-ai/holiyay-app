/**
 * Catch-all API Route
 *
 * Mounts the Hono app from @holiyay/api to handle all /api/* requests.
 * This allows the entire backend to run within Next.js on Vercel.
 */

import app from "@holiyay/api/app"
import { handle } from "hono/vercel"

// Re-export the Hono app handlers for Next.js
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)

// Use Node.js runtime for full compatibility with Drizzle/Postgres
export const runtime = "nodejs"

// Disable body parsing - Hono handles it
export const dynamic = "force-dynamic"

// Allow longer request timeouts for long-running operations - e.g., generating itineraries
export const maxDuration = 60
