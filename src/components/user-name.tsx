"use client"

import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

type UserNameProps = {
	id?: string | undefined
}

export function UserName({ id }: UserNameProps) {
	const { sessionToken } = useAuth()
	const { data, isLoading } = useQuery({
		queryKey: ["user", id],
		queryFn: async () => {
			if (!sessionToken) throw new Error("Unauthorized")
			if (!id) {
				return
			}
			const result = await api.auth.userById(id, sessionToken)
			if (result.error) {
				throw result.error
			}
			return result.data.user
		},
		enabled: !!sessionToken && !!id,
		staleTime: 1000 * 60 * 5,
	})
	if (isLoading) {
		return <Skeleton className="w-24 h-4 inline-flex" />
	}
	return <>{data?.name || data?.email || id}</>
}
