"use client"

/**
 * Protected Route Component
 *
 * Wraps pages that require authentication.
 * Redirects to login if user is not authenticated.
 */

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"

interface ProtectedRouteProps {
	children: React.ReactNode
	fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
	const { isAuthenticated, isLoading } = useAuth()

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			window.location.href = "/auth/login"
		}
	}, [isLoading, isAuthenticated])

	if (isLoading) {
		return (
			fallback || (
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-muted-foreground">Loading...</div>
				</div>
			)
		)
	}

	if (!isAuthenticated) {
		return null
	}

	return <>{children}</>
}
