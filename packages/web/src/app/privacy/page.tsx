import Link from "next/link"
import { Header } from "@/components/header"

export default function PrivacyPage() {
	return (
		<>
			<Header>
				<Link href="/" className="text-lg font-semibold">
					Holiyay
				</Link>
			</Header>
			<main className="flex flex-col items-center justify-center py-2 px-4">
				<section className="max-w-3xl mt-20 mb-20">
					<h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
					<p className="text-neutral-400 mb-2">
						Your privacy is important to us. This Privacy Policy explains how we
						collect, use, and protect your personal information when you use
						Holiyay.
					</p>
				</section>
			</main>
		</>
	)
}
