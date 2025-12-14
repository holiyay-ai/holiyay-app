"use client"

import { Portal } from "@radix-ui/react-portal"
import { Plus } from "lucide-react"
import { useLayoutEffect, useState } from "react"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Input } from "../ui/input"
import { CalendarProvider } from "./calendar-context"

export default function Calendar() {
	return (
		<CalendarProvider>
			<Controls />
			<div className="grid grid-cols-7 gap-2 w-full"></div>
		</CalendarProvider>
	)
}

function Controls() {
	const [headerContainer, setHeaderContainer] = useState(() =>
		document.getElementById("header-center"),
	)
	useLayoutEffect(() => {
		if (!headerContainer) {
			setHeaderContainer(document.getElementById("header-center"))
		}
	}, [headerContainer])
	if (!headerContainer) {
		return null
	}
	return (
		<Portal container={document.getElementById("header-center")} asChild>
			<div className="flex items-center gap-2 w-full">
				<Input className="w-full flex-1" placeholder="Search in your agenda" />
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button>
							<Plus />
							Create
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="center">
						<DropdownMenuItem>Item</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</Portal>
	)
}

function _Day() {
	return (
		<Card>
			<div className="flex flex-col items-start justify-start w-full">
				<p className="text-sm font-medium">Day</p>
				<p className="text-lg font-semibold">Date</p>
			</div>
		</Card>
	)
}
