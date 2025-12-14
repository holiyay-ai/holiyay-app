"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { useAuth } from "@/lib/auth-context"
import Calendar from "./calendar/calendar"
import { Landing } from "./landing"
import { Spinner } from "./ui/spinner"

export function Home() {
	const { isAuthenticated, isLoading } = useAuth()

	if (isLoading) {
		return (
			<main className="flex flex-col items-center justify-center min-h-screen py-2">
				<Spinner />
			</main>
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
				<Link href="/" className="text-lg font-semibold">
					Holiyay
				</Link>
			</Header>
			<main className="flex flex-col items-center justify-center py-2 px-4">
				<Calendar />
			</main>
		</>
	)
}
