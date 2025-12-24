import Link from "next/link"
import { ViewTransition } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Divider } from "@/components/ui/divider"

export function Landing() {
	return (
		<>
			<Header />
			<ViewTransition>
				<main className="flex flex-col items-center justify-center min-h-screen py-2">
					<section className="flex flex-col items-center justify-start gap-6 p-1 max-w-xs">
						<section className="flex flex-col items-center justify-center gap-1">
							<h1 className="text-4xl font-bold text-center">Holiyay</h1>
							<h2 className="text-xl font-medium text-neutral-300 text-center">
								Plan your holidays intelligently
							</h2>
						</section>
						<section className="flex flex-col items-stretch justify-stretch w-full px-1 gap-1">
							<Link href="/auth?type=login" passHref className="contents">
								<Button size="lg">Sign in</Button>
							</Link>
							<Divider>Or</Divider>
							<Link href="/auth?type=register" passHref className="contents">
								<Button size="lg">Sign up</Button>
							</Link>
						</section>
						<section className="pt-4 text-sm text-center text-neutral-600">
							<p>This is a placeholder landing page.</p>
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
					</section>
				</main>
			</ViewTransition>
		</>
	)
}
