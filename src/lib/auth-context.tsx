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
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react"
import { getSessionCookie } from "@/actions/get-session-cookie"
import type { AuthUser } from "@/api/types"
import api from "./api"
import { isJwtExpired } from "./jwt"

interface AuthContextValue {
	user: AuthUser | null
	sessionToken: string | null
	isLoading: boolean
	isAuthenticated: boolean
	logout: () => Promise<void>
	refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function useIntervalTokenState(initialValue: string | null) {
	const [value, _setValue] = useState(initialValue)
	const intervalRef = useRef<NodeJS.Timeout | null>(null)

	const setValue = useCallback(
		(val: string | null) => {
			_setValue(val)

			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}

			intervalRef.current = setInterval(() => {
				if (isJwtExpired(value)) {
					_setValue(null)
					if (intervalRef.current) {
						clearInterval(intervalRef.current)
					}
				}
			}, 60 * 1000) // Check every minute
		},
		[value],
	)

	return [value, setValue] as const
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const pathname = usePathname()
	const [user, setUser] = useState<AuthUser | null>(null)
	const [sessionToken, setSessionToken] = useIntervalTokenState(null)
	const [isLoading, setIsLoading] = useState(true)

	const isOnCallbackRoute = pathname.endsWith("/auth/oauth/callback")

	const refreshUser = async () => {
		try {
			const token = await getSessionCookie()
			if (!token) {
				setUser(null)
				setSessionToken(null)
				return
			}
			const response = await api.auth.me(token)
			if (response.data) {
				setUser(response.data.user)
				setSessionToken(token)
			} else {
				setUser(null)
				setSessionToken(null)
			}
		} catch (error) {
			console.error("Failed to fetch user:", error)
			setUser(null)
			setSessionToken(null)
		}
	}

	const logout = async () => {
		try {
			setUser(null)
			const token = await getSessionCookie()
			await api.auth.logout(token)
			setSessionToken(null)
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
		sessionToken,
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
