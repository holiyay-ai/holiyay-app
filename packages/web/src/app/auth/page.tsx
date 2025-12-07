import { AuthForm } from "@/components/auth-form"
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
	return (
		<>
			<Header />
			<main className="flex flex-col items-center justify-center min-h-screen py-2">
				<AuthForm type={type} />
			</main>
		</>
	)
}
