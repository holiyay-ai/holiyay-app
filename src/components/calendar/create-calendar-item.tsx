"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { SparklesIcon } from "lucide-react"
import { useCallback, useTransition } from "react"
import {
	FormProvider,
	useForm,
	useFormContext,
	useWatch,
} from "react-hook-form"
import { toast } from "sonner"
import type z from "zod"
import { postCalendarItemAction } from "@/actions/post-calendar-item"
import {
	type createItemSchema,
	createItemSchemaWithinRange,
} from "@/api/lib/schemas"
import type { CalendarWithItems } from "@/api/types"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog"
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "../ui/field"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Separator } from "../ui/separator"
import { Spinner } from "../ui/spinner"
import { Textarea } from "../ui/textarea"
import { useCalendar } from "./calendar-context"

type CreateItemFormType = z.infer<typeof createItemSchema>

export function CreateItemModal() {
	const {
		calendar,
		modals: { createItemModalOpen, setCreateItemModalOpen },
		refreshCalendar,
	} = useCalendar()
	if (!calendar) return null
	return (
		<Dialog open={createItemModalOpen} onOpenChange={setCreateItemModalOpen}>
			{createItemModalOpen && (
				<CreateItemForm
					onClose={() => setCreateItemModalOpen(false)}
					onCreated={async () => {
						await refreshCalendar()
					}}
					calendar={calendar}
				/>
			)}
		</Dialog>
	)
}

type CreateItemFormProps = {
	onClose: () => void
	onCreated: (itemId: string) => Promise<void>
	calendar: CalendarWithItems
}
function CreateItemForm({ onClose, onCreated, calendar }: CreateItemFormProps) {
	const form = useForm({
		defaultValues: {
			startDate: "",
			endDate: "",
			title: "",
			startTime: "",
			endTime: "",
			description: "",
			location: "",
		},
		mode: "onBlur",
		resolver: zodResolver(
			createItemSchemaWithinRange(calendar.startDate, calendar.endDate),
		),
	})
	const [isPending, startTransition] = useTransition()
	const onSubmit = form.handleSubmit(async (data) => {
		startTransition(async () => {
			const result = await postCalendarItemAction(data, calendar.id)
			if (result.data) {
				await onCreated(result.data.id)
				onClose()
			} else {
				toast.error(result.error.message || "Failed to create event")
			}
		})
	})
	return (
		<FormProvider {...form}>
			<DialogContent>
				<form className="contents" onSubmit={onSubmit}>
					<DialogHeader>
						<DialogTitle>Create a new event</DialogTitle>
						<DialogDescription>
							Fill in the details below to create a new event to your plan.
						</DialogDescription>
						<DialogClose type="button" onClick={onClose} />
					</DialogHeader>
					<FieldGroup>
						<Field data-invalid={!!form.formState.errors.title}>
							<FieldLabel htmlFor="title">Title</FieldLabel>
							<FieldDescription>Name of the event</FieldDescription>
							<Input
								type="text"
								id="title"
								{...form.register("title")}
								aria-invalid={!!form.formState.errors.title}
								disabled={isPending}
							/>
							<FieldError>{form.formState.errors.title?.message}</FieldError>
						</Field>

						<section className="flex flex-row gap-2 items-start">
							<Field data-invalid={!!form.formState.errors.startDate}>
								<FieldLabel htmlFor="startDate">Start date</FieldLabel>
								<Input
									type="text"
									id="startDate"
									{...form.register("startDate")}
									aria-invalid={!!form.formState.errors.startDate}
									disabled={isPending}
								/>
								<FieldError>
									{form.formState.errors.startDate?.message}
								</FieldError>
							</Field>
							<Field data-invalid={!!form.formState.errors.endDate}>
								<FieldLabel htmlFor="endDate"> End date</FieldLabel>
								<Input
									type="text"
									id="endDate"
									{...form.register("endDate")}
									aria-invalid={!!form.formState.errors.endDate}
									disabled={isPending}
								/>
								<FieldError>
									{form.formState.errors.endDate?.message}
								</FieldError>
							</Field>
						</section>
						<section className="flex flex-row gap-2 items-start">
							<Field data-invalid={!!form.formState.errors.startTime}>
								<FieldLabel htmlFor="startTime">Start time</FieldLabel>
								<Input
									type="text"
									id="startTime"
									{...form.register("startTime")}
									aria-invalid={!!form.formState.errors.startTime}
									disabled={isPending}
								/>
								<FieldError>
									{form.formState.errors.startTime?.message}
								</FieldError>
							</Field>
							<Field data-invalid={!!form.formState.errors.endTime}>
								<FieldLabel htmlFor="endTime">End time</FieldLabel>
								<Input
									type="text"
									id="endTime"
									{...form.register("endTime")}
									aria-invalid={!!form.formState.errors.endTime}
									disabled={isPending}
								/>
								<FieldError>
									{form.formState.errors.endTime?.message}
								</FieldError>
							</Field>
						</section>
						<div className="flex items-center min-w-[100px] gap-2">
							<Checkbox
								id="allDay"
								disabled={isPending}
								onCheckedChange={(checked) => {
									if (checked) {
										form.setValue("startTime", "00:00")
										form.setValue("endTime", "23:59")
									} else {
										form.setValue("startTime", "")
										form.setValue("endTime", "")
									}
								}}
								checked={
									form.watch("startTime") === "00:00" &&
									form.watch("endTime") === "23:59"
								}
							/>
							<Label htmlFor="allDay">All day</Label>
						</div>
						<Field data-invalid={!!form.formState.errors.description}>
							<FieldLabel htmlFor="description">
								Description (optional)
							</FieldLabel>
							<FieldDescription>
								Short description of the event
							</FieldDescription>
							<Textarea
								id="description"
								{...form.register("description")}
								aria-invalid={!!form.formState.errors.description}
								disabled={isPending}
							/>
							<FieldError>
								{form.formState.errors.description?.message}
							</FieldError>
						</Field>
					</FieldGroup>
					<WeatherReport />
					<Separator />
					<ChecklistHandler />
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isPending || !form.formState.isValid}
						>
							{isPending && <Spinner />}
							Create
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</FormProvider>
	)
}

function ChecklistHandler() {
	const _form = useFormContext<CreateItemFormType>()
	const [isPending, startTransition] = useTransition()
	const handleGenerateItems = useCallback(() => {
		startTransition(async () => {})
	}, [])

	return (
		<section inert={isPending} className={cn(isPending && "opacity-50")}>
			<div className="flex flex-row justify-between gap-2">
				<h4>Checklist</h4>
				<Button variant="outline" onClick={handleGenerateItems} type="button">
					<SparklesIcon />
				</Button>
			</div>
			<FieldGroup></FieldGroup>
		</section>
	)
}

function WeatherReport() {
	const location = useWatch<CreateItemFormType>({ name: "location" })
	if (!location) {
		return null
	}
	return (
		<>
			<Separator />
			<section>
				<div className="flex flex-row justify-between gap-2">
					<h4>Weather report</h4>
				</div>
			</section>
		</>
	)
}
