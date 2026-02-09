"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMediaQuery, useTimeout } from "@mantine/hooks"
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
import { useTranslation } from "react-i18next"
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
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "../ui/drawer"
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
	const isMobile = useMediaQuery("(max-width: 768px)")
	if (!calendar) return null
	return (
		<Drawer
			open={!!createItemModalOpen}
			onOpenChange={(open) => {
				if (open) {
					setCreateItemModalOpen(createItemModalOpen)
				} else {
					setCreateItemModalOpen(null)
				}
			}}
			direction={isMobile ? "bottom" : "right"}
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
		</Drawer>
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
	const { t } = useTranslation()
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
			<DrawerContent>
				<form className="contents" onSubmit={onSubmit}>
					<DrawerHeader>
						<WatchedDialogTitle />
						<DrawerDescription>
							{t("calendar:bodies.create_item_description")}
						</DrawerDescription>
						<DrawerClose type="button" onClick={onClose} />
					</DrawerHeader>
					<div className="no-scrollbar overflow-y-auto px-4 flex flex-col w-full gap-4">
						<FieldGroup>
							<Field data-invalid={!!form.formState.errors.title}>
								<FieldLabel htmlFor="title">
									{t("calendar:create_item.fields.title")}
								</FieldLabel>
								<FieldDescription>
									{t("calendar:create_item.descriptions.title")}
								</FieldDescription>
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
								<FieldLabel htmlFor="location">
									{t("calendar:create_item.fields.location")}
								</FieldLabel>
								<FieldDescription>
									{t("calendar:create_item.descriptions.location")}
								</FieldDescription>
								<Input
									type="text"
									id="location"
									{...form.register("location")}
									aria-invalid={!!form.formState.errors.location}
									disabled={isPending}
								/>
								<FieldError>
									{form.formState.errors.location?.message}
								</FieldError>
							</Field>
							<section className="flex flex-row gap-2 items-start">
								<Field data-invalid={!!form.formState.errors.startTime}>
									<FieldLabel htmlFor="startTime">
										{t("calendar:create_item.fields.start_time")}
									</FieldLabel>
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
									<FieldLabel htmlFor="endTime">
										{t("calendar:create_item.fields.end_time")}
									</FieldLabel>
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
								<Label htmlFor="allDay">
									{t("calendar:create_item.fields.all_day")}
								</Label>
							</div>
							<section className="flex flex-row gap-2 items-start">
								<Field data-invalid={!!form.formState.errors.startDate}>
									<FieldLabel htmlFor="startDate">
										{t("calendar:create_item.fields.start_date")}
									</FieldLabel>
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
									<FieldLabel htmlFor="endDate">
										{t("calendar:create_item.fields.end_date")}
									</FieldLabel>
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
								<Label htmlFor="sameDate">
									{t("calendar:create_item.fields.same_date")}
								</Label>
							</div>
							<Field data-invalid={!!form.formState.errors.description}>
								<FieldLabel htmlFor="description">
									{t("calendar:create_item.fields.description")}
								</FieldLabel>
								<FieldDescription>
									{t("calendar:create_item.descriptions.description")}
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
					</div>
					<DrawerFooter>
						<Button
							type="submit"
							disabled={isPending || !form.formState.isValid}
						>
							{isPending && <Spinner />}
							{t("calendar:create_item.actions.create_event")}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isPending}
						>
							{t("calendar:create_item.actions.cancel")}
						</Button>
					</DrawerFooter>
				</form>
			</DrawerContent>
		</FormProvider>
	)
}

function WatchedDialogTitle() {
	const { t } = useTranslation()
	const startDate = useWatch<CreateItemFormType>({ name: "startDate" })
	return (
		<DrawerTitle>
			{t("calendar:labels.create_item", {
				date: startDate ? format(new Date(startDate), "dd MMM yyyy") : "",
				context: startDate ? "on" : "",
			})}
		</DrawerTitle>
	)
}

function ChecklistHandler() {
	const { t } = useTranslation()
	const _form = useFormContext<CreateItemFormType>()
	const [isPending, startTransition] = useTransition()
	const handleGenerateItems = useCallback(() => {
		startTransition(async () => {})
	}, [])

	return (
		<section inert={isPending} className={cn(isPending && "opacity-50")}>
			<div className="flex flex-row justify-between gap-2">
				<h4>{t("calendar:create_item.labels.checklist")}</h4>
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
