"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

/**
 * OAuth Callback Page
 *
 * Handles OAuth redirects that come with hash fragments (implicit flow).
 * For PKCE flow (recommended), use /auth/callback route handler instead.
 */
export default function OAuthCallbackPage() {
	const router = useRouter()
	const { refreshUser } = useAuth()
	const [status, setStatus] = useState<"loading" | "error">("loading")

	useEffect(() => {
		// Only create client and handle callback on the client side
		const handleCallback = async () => {
			try {
				const supabase = createClient()

				// Check if we have a session (Supabase client auto-detects from URL hash)
				const {
					data: { session },
					error,
				} = await supabase.auth.getSession()

				if (error) {
					console.error("OAuth callback error:", error.message)
					setStatus("error")
					router.replace("/auth/login?error=auth_callback_error")
					return
				}

				if (session) {
					// Successfully authenticated
					await refreshUser()
					router.replace("/")
				} else {
					// No session found, redirect to login
					router.replace("/auth/login")
				}
			} catch (err) {
				console.error("OAuth callback failed:", err)
				setStatus("error")
				router.replace("/auth/login?error=auth_callback_error")
			}
		}

		handleCallback()
	}, [router, refreshUser])

	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center">
				{status === "loading" && (
					<>
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4" />
						<p>Signing you in…</p>
					</>
				)}
				{status === "error" && <p>Authentication failed. Redirecting...</p>}
			</div>
		</div>
	)
}
