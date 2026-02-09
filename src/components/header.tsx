"use client"

import { useWindowScroll } from "@mantine/hooks"
import { cn } from "@/lib/utils"
import { AppMenu } from "./app-menu"

type HeaderProps = {
	hidden: boolean
	position?: React.CSSProperties["position"]
}
export function Header({ position = "sticky", hidden }: HeaderProps) {
	return (
		<HeaderElement position={position} hidden={hidden}>
			<section
				className="flex flex-row items-center justify-start flex-1 gap-4"
				id="header-left"
			/>
			<section
				className="flex-row items-center justify-center flex-1 gap-4 hidden sm:flex"
				id="header-center"
			/>
			<section
				className="flex flex-row items-center justify-end flex-0 gap-2 sm:flex-1"
				id="header-right"
			>
				<AppMenu />
			</section>
		</HeaderElement>
	)
}

function HeaderElement({
	position = "sticky",
	hidden,
	children,
}: HeaderProps & { children: React.ReactNode }) {
	const [scroll] = useWindowScroll()
	return (
		<header
			className={cn(
				"flex flex-row items-center justify-end px-4 py-2 sm:p-4 w-full z-50 transition-all",
				position === "fixed" ? "fixed top-0 left-0" : "",
				position === "sticky" ? "sticky top-0 left-0" : "",
				hidden ? "hidden" : "",
				scroll.y > 8 ? "border-b-accent border-b-2 backdrop-blur-md" : "",
			)}
		>
			{children}
		</header>
	)
}
