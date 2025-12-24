import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ViewTransition } from "react"
import { AuthForm } from "@/components/auth-form"
import { Header } from "@/components/header"
import { checkIfExpired } from "@/lib/jwt"

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

	if (!checkIfExpired(session)) {
		return redirect("/")
	}

	return (
		<>
			<Header />
			<ViewTransition>
				<main className="flex flex-col items-center justify-center min-h-screen py-2">
					<AuthForm type={type} />
					<section className="pt-4 text-sm text-center text-neutral-600">
						<p>
							By signing in or signing up, you agree to our{" "}
							<Link href="/terms" className="underline">
								Terms of Service
							</Link>{" "}
							and{" "}
							<Link href="/privacy" className="underline">
								Privacy Policy
							</Link>
							.
						</p>
					</section>
				</main>
			</ViewTransition>
		</>
	)
}
