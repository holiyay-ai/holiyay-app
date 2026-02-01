"use client"

import { SWRConfig } from "swr"

export function QueryProvider({ children }: { children: React.ReactNode }) {
	return (
		<SWRConfig
			value={{
				provider: () => new Map(),
				shouldRetryOnError: false,
			}}
		>
			{children}
		</SWRConfig>
	)
}
