"use client"

import { cn } from "@/lib/utils"
import { AppMenu } from "./app-menu"

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
	return (
		<header
			className={cn(
				"flex flex-row items-center justify-end px-4 py-2 sm:p-4 w-full",
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
				className="flex-row items-center justify-center flex-1 gap-4 hidden sm:flex"
				id="header-center"
			>
				{centerChildren}
			</section>
			<section
				className="flex flex-row items-center justify-end flex-0 gap-2 sm:flex-1"
				id="header-right"
			>
				<AppMenu />
			</section>
		</header>
	)
}
