"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export default function OAuthCallbackPage() {
	const router = useRouter()
	const { refreshUser } = useAuth()

	// biome-ignore lint/correctness/useExhaustiveDependencies: Only run once on mount
	useEffect(() => {
		;(async () => {
			const hash = (window.location.hash || "").replace(/^#/, "")
			const qs = new URLSearchParams(hash)
			const accessToken = qs.get("access_token") ?? undefined
			const refreshToken = qs.get("refresh_token") ?? undefined
			const expiresIn = qs.get("expires_in")
				? Number(qs.get("expires_in"))
				: undefined

			if (!accessToken) {
				toast.error("Failed to parse authentication response")
				router.replace("/auth?type=login")
				return
			}

			try {
				const res = await api.auth.oauthCallback(
					accessToken,
					refreshToken,
					expiresIn,
				)

				if (res.error) {
					toast.error(res.error.message ?? "OAuth failed")
					router.replace("/auth?type=login")
					return
				}

				await refreshUser()
				router.replace("/")
			} catch (_err) {
				toast.error("OAuth failed")
				router.replace("/auth?type=login")
			}
		})()
	}, [router])

	return (
		<div className="flex items-center justify-center min-h-screen">
			Signing you in…
		</div>
	)
}
