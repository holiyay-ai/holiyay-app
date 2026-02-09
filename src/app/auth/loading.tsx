import { ViewTransition } from "react"
import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
	return (
		<ViewTransition>
			<div className="flex flex-col items-center justify-center min-h-screen">
				<Spinner />
			</div>
		</ViewTransition>
	)
}
