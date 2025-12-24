"use client"

import Link from "next/link"
import { ViewTransition } from "react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { ModeToggle } from "./mode-toggle"
import { Button } from "./ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu"

type HeaderProps = {
	children?: React.ReactNode
	centerChildren?: React.ReactNode
	position?: React.CSSProperties["position"]
}
export function Header({
	children,
	centerChildren,
	position = "fixed",
}: HeaderProps) {
	const { user, isAuthenticated, logout } = useAuth()

	return (
		<header
			className={cn(
				"flex flex-row items-center justify-end gap-4 p-4 w-full",
				position === "fixed" ? "fixed top-0 left-0" : "",
			)}
		>
			<section
				className="flex flex-row items-center justify-start flex-1 gap-4"
				id="header-left"
			>
				{children}
			</section>
			<section
				className="flex flex-row items-center justify-center flex-1 gap-4"
				id="header-center"
			>
				{centerChildren}
			</section>
			<section
				className="flex flex-row items-center justify-end flex-1 gap-2"
				id="header-right"
			>
				{isAuthenticated && user && (
					<ViewTransition>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="rounded-full">
									{user.name}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>My Account</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
								<DropdownMenuSeparator />
								<Link href="/terms" passHref>
									<DropdownMenuItem>Terms of Service</DropdownMenuItem>
								</Link>
								<Link href="/privacy" passHref>
									<DropdownMenuItem>Privacy policy</DropdownMenuItem>
								</Link>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</ViewTransition>
				)}
				<ViewTransition>
					<ModeToggle />
				</ViewTransition>
			</section>
		</header>
	)
}
