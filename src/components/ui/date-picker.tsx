"use client"

import { useUncontrolled } from "@mantine/hooks"
import { format, parse } from "date-fns"
import { CalendarIcon } from "lucide-react"
import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"

function isValidDate(date: Date | undefined) {
	if (!date) {
		return false
	}
	return !Number.isNaN(date.getTime())
}

interface DatePickerProps {
	value: string
	onChange: (date: string) => void
	placeholder?: string
	disabled?: boolean
	"aria-invalid"?: boolean
	id?: string
}

export function DatePickerInput({
	value,
	onChange,
	placeholder,
	disabled,
	id,
	...props
}: DatePickerProps) {
	const [finalValue, handleChange] = useUncontrolled({
		value,
		onChange,
	})
	const [open, setOpen] = React.useState(false)
	const [date, setDate] = React.useState<Date | undefined>(
		value ? parse(value, "yyyy-MM-dd", new Date()) : new Date(),
	)
	const [month, setMonth] = React.useState<Date | undefined>(date)
	const [inputValue, setInputValue] = React.useState("")

	return (
		<InputGroup>
			<InputGroupInput
				id={id}
				value={finalValue || inputValue}
				placeholder={placeholder}
				onChange={(e) => {
					const date = new Date(e.target.value)
					setInputValue(e.target.value)
					if (isValidDate(date)) {
						setDate(date)
						setMonth(date)
						handleChange(date.toISOString())
					}
				}}
				onKeyDown={(e) => {
					if (e.key === "ArrowDown") {
						e.preventDefault()
						setOpen(true)
					}
				}}
				{...props}
			/>
			<InputGroupAddon align="inline-end">
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<InputGroupButton
							id={[id, "date-picker"].filter(Boolean).join("-")}
							variant="ghost"
							size="icon-xs"
							aria-label="Select date"
						>
							<CalendarIcon />
							<span className="sr-only">Select date</span>
						</InputGroupButton>
					</PopoverTrigger>
					<PopoverContent
						className="w-auto overflow-hidden p-0"
						align="end"
						alignOffset={-8}
						sideOffset={10}
					>
						<Calendar
							mode="single"
							selected={date}
							month={month}
							onMonthChange={setMonth}
							onSelect={(date) => {
								setDate(date)
								setMonth(date)
								setInputValue(date ? format(date, "dd MMM yyyy") : "")
								handleChange(date ? date.toISOString() : "")
								setOpen(false)
							}}
						/>
					</PopoverContent>
				</Popover>
			</InputGroupAddon>
		</InputGroup>
	)
}
