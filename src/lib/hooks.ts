"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import useSWR from "swr"
import { useAuth } from "./auth-context"

export function useMutableSearchParams() {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	// Get a new searchParams string by merging the current
	// searchParams with a provided key/value pair
	const createQueryString = useCallback(
		(name: string, value: string) => {
			const params = new URLSearchParams(searchParams.toString())
			params.set(name, value)

			return params.toString()
		},
		[searchParams],
	)

	const updateSearchParams = useCallback(
		(name: string, value: string) => {
			const newSearchString = createQueryString(name, value)
			router.push(`${pathname}?${newSearchString}`)
		},
		[createQueryString, pathname, router],
	)

	return { updateSearchParams }
}

type UseApiParams<T> = [
	Parameters<typeof useSWR<T>>[0],
	Parameters<typeof useSWR<T>>[1],
	Parameters<typeof useSWR<T>>[2]?,
]
export function useApi<T>(...args: UseApiParams<T>) {
	const [key, fetcher, config] = args
	const { isAuthenticated } = useAuth()
	return useSWR(() => (isAuthenticated ? key : null), fetcher, { ...config })
}
