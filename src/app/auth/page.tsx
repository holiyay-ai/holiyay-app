import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ViewTransition } from "react"
import { AuthForm } from "@/components/auth-form"
import { Disclaimer } from "@/components/disclaimer"
import { Header } from "@/components/header"

export default async function AuthPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
	const params = await searchParams
	const type =
		typeof params.type === "string" &&
		["login", "register"].includes(params.type)
			? (params.type as "login" | "register")
			: "login"
	const cookieStorage = await cookies()

	const session = cookieStorage.get("holiyay_session")?.value

	if (session) {
		return redirect("/")
	}

	return (
		<>
			<Header />
			<ViewTransition>
				<main className="flex flex-col items-center justify-center min-h-screen py-2">
					<AuthForm type={type} />
					<section className="pt-4 text-sm text-center text-neutral-600">
						<Disclaimer />
					</section>
				</main>
			</ViewTransition>
		</>
	)
}
