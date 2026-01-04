"use client"

import { getUserByIdAction } from "@/actions/get-user-by-id"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/lib/hooks"

type UserNameProps = {
	id?: string | undefined
}

export function UserName({ id }: UserNameProps) {
	const { data, isLoading } = useApi(["user", id], async () => {
		if (!id) {
			return
		}
		const result = await getUserByIdAction(id)
		if (result.error) {
			throw result.error
		}
		return result.data.user
	})
	if (isLoading) {
		return <Skeleton className="w-24 h-4 inline-flex" />
	}
	return <>{data?.name || data?.email || id}</>
}
