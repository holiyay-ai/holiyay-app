import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ViewTransition } from "react"
import { Disclaimer } from "@/components/disclaimer"

export default async function AuthPage({
	children,
}: {
	children: React.ReactNode
}) {
	const cookieStorage = await cookies()

	const session = cookieStorage.get("holiyay_session")?.value

	if (session) {
		return redirect("/")
	}

	return (
		<ViewTransition>
			<main className="flex flex-col items-center justify-center flex-1 py-2">
				{children}
				<section className="pt-4 text-sm text-center text-neutral-600">
					<Disclaimer />
				</section>
			</main>
		</ViewTransition>
	)
}
