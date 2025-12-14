"use client"

/**
 * Auth Context Provider
 *
 * Manages authentication state on the client side.
 * Provides user info, loading state, and auth methods.
 * Works with HTTP-only cookies for secure session management.
 */

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react"
import { getSessionCookie } from "@/actions/get-session-cookie"
import type { AuthUser } from "@/api/types"
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
	const [user, setUser] = useState<AuthUser | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const refreshUser = async () => {
		try {
			const token = await getSessionCookie()
			const response = await api.auth.me(token)
			if (response.data) {
				setUser(response.data.user)
			} else {
				setUser(null)
			}
		} catch (error) {
			console.error("Failed to fetch user:", error)
			setUser(null)
		}
	}

	const logout = async () => {
		try {
			const token = await getSessionCookie()
			await api.auth.logout(token)
			setUser(null)
			window.location.href = "/auth?type=login"
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

		initAuth()
	}, [])

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
