"use client"

import { SWRConfig } from "swr"

export function QueryProvider({ children }: { children: React.ReactNode }) {
	return (
		<SWRConfig
			value={{
				// 1 minute dedupe
				dedupingInterval: 60 * 1000,
				provider: () => new Map(),
				shouldRetryOnError: false,
			}}
		>
			{children}
		</SWRConfig>
	)
}
