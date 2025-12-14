"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function ModeToggle() {
	const { setTheme, theme } = useTheme()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon">
					<Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
					<Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onClick={() => setTheme("light")}
					className={cn(
						theme === "light" && "bg-accent text-accent-foreground",
					)}
				>
					Light
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme("dark")}
					className={cn(theme === "dark" && "bg-accent text-accent-foreground")}
				>
					Dark
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme("system")}
					className={cn(
						theme === "system" && "bg-accent text-accent-foreground",
					)}
				>
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
