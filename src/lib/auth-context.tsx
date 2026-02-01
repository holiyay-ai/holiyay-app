"use client"

/**
 * Auth Context Provider
 *
 * Manages authentication state on the client side using Supabase SSR.
 * Provides user info, loading state, and auth methods.
 * Session management is handled automatically by @supabase/ssr cookies.
 */

import { usePathname, useRouter } from "next/navigation"
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react"
import { createClient } from "@/lib/supabase/client"
import type { AuthUser } from "@/types"

interface AuthContextValue {
	user: AuthUser | null
	isLoading: boolean
	isAuthenticated: boolean
	logout: () => Promise<void>
	refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
	const pathname = usePathname()
	const router = useRouter()
	const [user, setUser] = useState<AuthUser | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const supabase = createClient()

	const isOnCallbackRoute = pathname.endsWith("/auth/callback")

	const refreshUser = async () => {
		try {
			const {
				data: { user: supabaseUser },
			} = await supabase.auth.getUser()

			if (!supabaseUser) {
				setUser(null)
				return
			}

			setUser({
				id: supabaseUser.id,
				email: supabaseUser.email ?? "",
				name:
					supabaseUser.user_metadata?.name ??
					supabaseUser.email?.split("@")[0] ??
					"",
				avatarUrl: supabaseUser.user_metadata?.avatar_url ?? null,
			})
		} catch (error) {
			console.error("Failed to fetch user:", error)
			setUser(null)
		}
	}

	const logout = async () => {
		try {
			setUser(null)
			await supabase.auth.signOut()
			router.push("/auth?type=login")
		} catch (error) {
			console.error("Logout failed:", error)
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: Only run once on route change
	useEffect(() => {
		const initAuth = async () => {
			setIsLoading(true)
			await refreshUser()
			setIsLoading(false)
		}

		if (!isOnCallbackRoute) {
			initAuth()
		}

		// Listen for auth state changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			if (event === "SIGNED_IN" && session?.user) {
				setUser({
					id: session.user.id,
					email: session.user.email ?? "",
					name:
						session.user.user_metadata?.name ??
						session.user.email?.split("@")[0] ??
						"",
					avatarUrl: session.user.user_metadata?.avatar_url ?? null,
				})
			} else if (event === "SIGNED_OUT") {
				setUser(null)
			}
		})

		return () => {
			subscription.unsubscribe()
		}
	}, [isOnCallbackRoute])

	const value: AuthContextValue = {
		user,
		isLoading,
		isAuthenticated: !!user,
		logout,
		refreshUser,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider")
	}
	return context
}
