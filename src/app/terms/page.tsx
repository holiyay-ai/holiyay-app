import Link from "next/link"
import { Header } from "@/components/header"

export default function TermsPage() {
	return (
		<>
			<Header>
				<Link href="/" className="text-lg font-semibold">
					Holiyay
				</Link>
			</Header>
			<main className="flex flex-col items-center justify-center py-2 px-4">
				<section className="max-w-3xl mt-20 mb-20">
					<h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
					<p className="text-neutral-400 mb-2">
						Welcome to Holiyay! These Terms of Service govern your use of our
						website and services. By accessing or using Holiyay, you agree to
						comply with and be bound by these terms.
					</p>
				</section>
			</main>
		</>
	)
}
