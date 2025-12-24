"use client"

import { FileExclamationPointIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"

export default function ErrorPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen">
			<Empty>
				<EmptyHeader>
					<EmptyMedia>
						<FileExclamationPointIcon />
					</EmptyMedia>
					<EmptyTitle>An error occurred</EmptyTitle>
					<EmptyDescription>
						Sorry, something went wrong while loading this page.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					Please try refreshing the page or contact support if the problem
					persists.
				</EmptyContent>
				<Link href="/" passHref>
					<Button>Return to the homepage</Button>
				</Link>
			</Empty>
		</div>
	)
}
