import { ModeToggle } from "./mode-toggle"

type HeaderProps = {
	children?: React.ReactNode
	centerChildren?: React.ReactNode
}
export function Header({ children, centerChildren }: HeaderProps) {
	return (
		<header className="flex flex-row items-center justify-end gap-4 p-4 fixed top-0 left-0 w-full">
			<section className="flex flex-row items-center justify-start flex-1">
				{children}
			</section>
			<section className="flex flex-row items-center justify-center flex-1">
				{centerChildren}
			</section>
			<section className="flex flex-row items-center justify-end flex-1">
				<ModeToggle />
			</section>
		</header>
	)
}
