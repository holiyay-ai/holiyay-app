import { FileExclamationPointIcon } from "lucide-react"
import Link from "next/link"
import { ViewTransition } from "react"
import { Button } from "@/components/ui/button"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"

export default function NotFound() {
	return (
		<ViewTransition>
			<div className="flex flex-col items-center justify-center min-h-screen">
				<Empty>
					<EmptyHeader>
						<EmptyMedia>
							<FileExclamationPointIcon />
						</EmptyMedia>
						<EmptyTitle>404 - Page Not Found</EmptyTitle>
						<EmptyDescription>
							The page you are looking for does not exist.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						Please check the URL or return to the homepage.
					</EmptyContent>
					<Link href="/" passHref>
						<Button>Return to the homepage</Button>
					</Link>
				</Empty>
			</div>
		</ViewTransition>
	)
}
