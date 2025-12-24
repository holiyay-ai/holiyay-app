"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { Suspense, ViewTransition } from "react"
import { Header } from "@/components/header"
import { useAuth } from "@/lib/auth-context"
import { Landing } from "./landing"
import { Spinner } from "./ui/spinner"

const Calendar = dynamic(() => import("./calendar/calendar"), {
	ssr: false,
})

export function Home() {
	const { isAuthenticated, isLoading } = useAuth()

	if (isLoading) {
		return (
			<ViewTransition>
				<main className="flex flex-col items-center justify-center min-h-screen py-2">
					<Spinner />
				</main>
			</ViewTransition>
		)
	}

	if (isAuthenticated) {
		return <HomePageContent />
	}

	return <Landing />
}

function HomePageContent() {
	return (
		<>
			<Header position="sticky">
				<ViewTransition>
					<Link href="/" className="text-lg font-semibold">
						Holiyay
					</Link>
				</ViewTransition>
			</Header>
			<ViewTransition>
				<main className="flex flex-col items-center justify-center py-2 px-4">
					<Suspense fallback={<Spinner />}>
						<Calendar />
					</Suspense>
				</main>
			</ViewTransition>
		</>
	)
}
