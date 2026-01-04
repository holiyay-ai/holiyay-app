"use client"

/**
 * Auth Context Provider
 *
 * Manages authentication state on the client side.
 * Provides user info, loading state, and auth methods.
 * Works with HTTP-only cookies for secure session management.
 */

import { usePathname } from "next/navigation"
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react"
import type { AuthUser } from "@/api/types"
import { getCurrentUser } from "../actions/get-current-user"
import api from "./api"

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
	const [user, setUser] = useState<AuthUser | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const isOnCallbackRoute = pathname.endsWith("/auth/oauth/callback")

	const refreshUser = async () => {
		try {
			const user = await getCurrentUser()
			if (!user) {
				setUser(null)
				return
			}
			setUser(user)
		} catch (error) {
			console.error("Failed to fetch user:", error)
			setUser(null)
		}
	}

	const logout = async () => {
		try {
			setUser(null)
			await api.auth.logout()
		} catch (error) {
			console.error("Logout failed:", error)
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: Run once on mount
	useEffect(() => {
		const initAuth = async () => {
			setIsLoading(true)
			await refreshUser()
			setIsLoading(false)
		}

		if (!isOnCallbackRoute) initAuth()
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
