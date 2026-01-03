"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { postCalendarItemAction } from "@/actions/post-calendar-item"
import { createItemSchema } from "@/api/lib/schemas"
import { useAuth } from "@/lib/auth-context"
import { Button } from "../ui/button"
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
import { Spinner } from "../ui/spinner"
import { Textarea } from "../ui/textarea"
import { useCalendar } from "./calendar-context"

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
					calendarId={calendar.id}
				/>
			)}
		</Dialog>
	)
}

type CreateItemFormProps = {
	onClose: () => void
	onCreated: (itemId: string) => Promise<void>
	calendarId: string
}
function CreateItemForm({
	onClose,
	onCreated,
	calendarId,
}: CreateItemFormProps) {
	const { sessionToken } = useAuth()
	const form = useForm({
		defaultValues: {
			date: "",
			title: "",
			startTime: "",
			endTime: "",
			description: "",
		},
		mode: "onBlur",
		resolver: zodResolver(createItemSchema),
	})
	const [isPending, startTransition] = useTransition()
	const onSubmit = form.handleSubmit(async (data) => {
		if (!sessionToken) {
			throw new Error("User is not authenticated")
		}
		startTransition(async () => {
			const result = await postCalendarItemAction(
				data,
				calendarId,
				sessionToken,
			)
			if (result.data) {
				await onCreated(result.data.id)
				onClose()
			} else {
				toast.error(result.error.message || "Failed to create event")
			}
		})
	})
	return (
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
						<Field data-invalid={!!form.formState.errors.date}>
							<FieldLabel htmlFor="date">When?</FieldLabel>
							<Input
								type="text"
								id="date"
								{...form.register("date")}
								aria-invalid={!!form.formState.errors.date}
								disabled={isPending}
							/>
							<FieldError>{form.formState.errors.date?.message}</FieldError>
						</Field>
						<section className="flex flex-row gap-2 items-start">
							<Field data-invalid={!!form.formState.errors.startTime}>
								<FieldLabel htmlFor="startTime">From</FieldLabel>
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
								<FieldLabel htmlFor="endTime">To</FieldLabel>
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
					</section>
					<Field data-invalid={!!form.formState.errors.description}>
						<FieldLabel htmlFor="description">
							Description (optional)
						</FieldLabel>
						<FieldDescription>Short description of the event</FieldDescription>
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
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending || !form.formState.isValid}>
						{isPending && <Spinner />}
						Create
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	)
}
