"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTimeout } from "@mantine/hooks"
import { format } from "date-fns"
import { SparklesIcon } from "lucide-react"
import { useCallback, useEffect, useTransition } from "react"
import {
	Controller,
	FormProvider,
	useForm,
	useFormContext,
	useWatch,
} from "react-hook-form"
import { toast } from "sonner"
import type z from "zod"
import { getWeatherAction } from "@/actions/get-weather"
import { postCalendarItemAction } from "@/actions/post-calendar-item"
import { useApi } from "@/lib/hooks"
import {
	type createItemSchema,
	createItemSchemaWithinRange,
} from "@/lib/schemas"
import { cn } from "@/lib/utils"
import type { CalendarWithItems } from "@/types"
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import { DatePickerInput } from "../ui/date-picker"
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
		<Dialog
			open={!!createItemModalOpen}
			onOpenChange={(open) => {
				if (open) {
					setCreateItemModalOpen(createItemModalOpen)
				} else {
					setCreateItemModalOpen(null)
				}
			}}
		>
			<CreateItemForm
				onClose={() => setCreateItemModalOpen(null)}
				onCreated={async () => {
					await refreshCalendar()
				}}
				calendar={calendar}
				startDate={createItemModalOpen?.startDate}
				isOpen={!!createItemModalOpen}
			/>
		</Dialog>
	)
}

type CreateItemFormProps = {
	onClose: () => void
	onCreated: (itemId: string) => Promise<void>
	calendar: CalendarWithItems
	startDate?: string | undefined
	isOpen: boolean
}
function CreateItemForm({
	onClose,
	onCreated,
	calendar,
	startDate,
	isOpen,
}: CreateItemFormProps) {
	const form = useForm({
		defaultValues: {
			startDate: startDate || "",
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
	const resetForm = useTimeout(() => form.reset(), 300)
	const handleClose = useCallback(() => {
		onClose()
		resetForm.start()
	}, [onClose, resetForm.start])
	const onSubmit = form.handleSubmit(async (data) => {
		startTransition(async () => {
			const result = await postCalendarItemAction(calendar.id, data)
			if (result.data) {
				await onCreated(result.data.id)
				handleClose()
			} else {
				toast.error(result.error.message || "Failed to create event")
			}
		})
	})
	useEffect(() => {
		if (isOpen && startDate) {
			form.setValue("startDate", startDate)
		}
		if (!isOpen) {
			resetForm.start()
		}
		return () => {
			resetForm.clear()
		}
	}, [isOpen, startDate, form, resetForm.clear, resetForm.start])
	return (
		<FormProvider {...form}>
			<DialogContent>
				<form className="contents" onSubmit={onSubmit}>
					<DialogHeader>
						<WatchedDialogTitle />
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
						<Field data-invalid={!!form.formState.errors.location}>
							<FieldLabel htmlFor="location">Location</FieldLabel>
							<FieldDescription>
								Where is the event taking place?
							</FieldDescription>
							<Input
								type="text"
								id="location"
								{...form.register("location")}
								aria-invalid={!!form.formState.errors.location}
								disabled={isPending}
							/>
							<FieldError>{form.formState.errors.location?.message}</FieldError>
						</Field>
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
										form.setValue("startTime", "00:00", {
											shouldValidate: true,
										})
										form.setValue("endTime", "23:59", {
											shouldValidate: true,
										})
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
						<section className="flex flex-row gap-2 items-start">
							<Field data-invalid={!!form.formState.errors.startDate}>
								<FieldLabel htmlFor="startDate">Start date</FieldLabel>
								<Controller
									name="startDate"
									render={({ field }) => (
										<DatePickerInput
											id="startDate"
											value={field.value}
											onChange={field.onChange}
											aria-invalid={!!form.formState.errors.startDate}
											disabled={isPending}
										/>
									)}
								/>
								<FieldError>
									{form.formState.errors.startDate?.message}
								</FieldError>
							</Field>
							<Field data-invalid={!!form.formState.errors.endDate}>
								<FieldLabel htmlFor="endDate"> End date</FieldLabel>
								<Controller
									name="endDate"
									render={({ field }) => (
										<DatePickerInput
											id="endDate"
											value={field.value}
											onChange={field.onChange}
											aria-invalid={!!form.formState.errors.endDate}
											disabled={isPending}
										/>
									)}
								/>
								<FieldError>
									{form.formState.errors.endDate?.message}
								</FieldError>
							</Field>
						</section>
						<div className="flex items-center min-w-[100px] gap-2">
							<Checkbox
								id="sameDate"
								disabled={isPending}
								onCheckedChange={(checked) => {
									if (checked) {
										form.setValue("endDate", form.watch("startDate"))
									} else {
										form.setValue("endDate", "")
									}
								}}
								checked={form.watch("startDate") === form.watch("endDate")}
							/>
							<Label htmlFor="sameDate">Ends same day</Label>
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
					{/*<WeatherReport />*/}
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

function WatchedDialogTitle() {
	const startDate = useWatch<CreateItemFormType>({ name: "startDate" })
	return (
		<DialogTitle>
			Create a new event
			{startDate ? ` on ${format(startDate, "dd MMM yyyy")}` : ""}
		</DialogTitle>
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

function _WeatherReport() {
	const location = useWatch<CreateItemFormType, "location">({
		name: "location",
	})
	const startDate = useWatch<CreateItemFormType, "startDate">({
		name: "startDate",
	})
	const endDate = useWatch<CreateItemFormType, "endDate">({ name: "endDate" })

	const { data, isLoading, error, mutate } = useApi(
		() =>
			location || startDate
				? [
						"weather",
						String(location),
						String(startDate),
						String(endDate ?? startDate),
					]
				: null,
		async ([_, location, startDate, endDate]) => {
			// server action will throw on error; useApi will surface that
			return await getWeatherAction({
				location,
				startDate: String(startDate),
				endDate: String(endDate ?? startDate),
			})
		},
		{ revalidateOnFocus: false },
	)

	const [isRefreshing, startRefresh] = useTransition()

	// require at least a location and a start date to show weather
	if (!location || !startDate) {
		return null
	}

	// build a list of ISO dates between start and end (inclusive)
	const dates: string[] = []
	{
		const s = new Date(`${String(startDate)}T00:00:00`)
		const e = new Date(`${String(endDate ?? startDate)}T00:00:00`)
		for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
			dates.push(d.toISOString().slice(0, 10))
		}
	}

	return (
		<>
			<Separator />
			<section>
				<div className="flex flex-row justify-between gap-2">
					<h4>Weather report</h4>
					<div className="flex items-center gap-2">
						{isLoading && <Spinner />}
						<Button
							variant="outline"
							size="sm"
							onClick={() => startRefresh(() => void mutate())}
							disabled={isLoading || isRefreshing}
						>
							Refresh
						</Button>
					</div>
				</div>

				<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
					{dates.map((date) => {
						const w = data?.byDate?.[date]
						return (
							<div
								key={date}
								className="flex flex-col gap-1 p-3 border rounded-md bg-card"
							>
								<div className="text-sm">
									{format(new Date(date), "dd MMM yyyy")}
								</div>

								{w ? (
									<>
										<div className="text-lg font-semibold">
											{Math.round(w.temperature)}°
											{(data?.units ?? "metric") === "imperial" ? "F" : "C"}
										</div>
										<div className="text-sm text-muted-foreground capitalize">
											{w.description}
										</div>
										<div className="text-xs text-muted-foreground">
											Humidity {w.humidity}% · Wind {Math.round(w.windSpeed)}
										</div>
									</>
								) : (
									<div className="text-sm text-muted-foreground">
										No forecast available for this date
									</div>
								)}
							</div>
						)
					})}
				</div>

				{error && (
					<div className="mt-2 text-sm text-destructive">
						Failed to load weather — try again or check your destination.
					</div>
				)}
			</section>
		</>
	)
}
