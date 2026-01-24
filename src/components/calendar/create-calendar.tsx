"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTimeout } from "@mantine/hooks"
import { useCallback, useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { postCalendarAction } from "@/actions/post-calendar"
import { createCalendarSchema } from "@/api/lib/schemas"
import { useMutableSearchParams } from "@/lib/hooks"
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
import { useCalendar } from "./calendar-context"

export function CreateCalendarModal() {
	const {
		modals: { createCalendarModalOpen, setCreateCalendarModalOpen },
	} = useCalendar()
	const { updateSearchParams } = useMutableSearchParams()
	return (
		<Dialog
			open={createCalendarModalOpen}
			onOpenChange={setCreateCalendarModalOpen}
		>
			<CreateCalendarForm
				onClose={() => setCreateCalendarModalOpen(false)}
				onCreated={async (calendarId) => {
					updateSearchParams("calendar_id", calendarId)
				}}
				isOpen={!!createCalendarModalOpen}
			/>
		</Dialog>
	)
}

type CreateCalendarFormProps = {
	onClose: () => void
	onCreated: (calendarId: string) => Promise<void>
	isOpen: boolean
}
function CreateCalendarForm({
	onClose,
	onCreated,
	isOpen,
}: CreateCalendarFormProps) {
	const form = useForm({
		defaultValues: {
			name: "",
			startDate: "",
			endDate: "",
			destination: "",
		},
		mode: "onBlur",
		resolver: zodResolver(createCalendarSchema),
	})
	const [isPending, startTransition] = useTransition()
	const resetForm = useTimeout(() => form.reset(), 300)
	const handleClose = useCallback(() => {
		onClose()
		resetForm.start()
	}, [onClose, resetForm])
	const onSubmit = form.handleSubmit(async (data) => {
		startTransition(async () => {
			const result = await postCalendarAction(data)
			if (result.data) {
				await onCreated(result.data.id)
				handleClose()
			} else {
				toast.error("Failed to create plan")
			}
		})
	})
	useEffect(() => {
		if (!isOpen) {
			resetForm.start()
		}
		return () => resetForm.clear()
	}, [isOpen, resetForm])
	return (
		<DialogContent>
			<form className="contents" onSubmit={onSubmit}>
				<DialogHeader>
					<DialogTitle>Create a new plan</DialogTitle>
					<DialogDescription>
						Fill in the details below to create your new plan.
					</DialogDescription>
					<DialogClose type="button" onClick={onClose} />
				</DialogHeader>
				<FieldGroup>
					<Field data-invalid={!!form.formState.errors.name}>
						<FieldLabel htmlFor="name">Name</FieldLabel>
						<FieldDescription>
							Give your trip a name to easily identify it
						</FieldDescription>
						<Input
							type="text"
							id="name"
							{...form.register("name")}
							aria-invalid={!!form.formState.errors.name}
							disabled={isPending}
						/>
						<FieldError>{form.formState.errors.name?.message}</FieldError>
					</Field>
					<section className="flex flex-row gap-2 items-start">
						<Field data-invalid={!!form.formState.errors.startDate}>
							<FieldLabel htmlFor="startDate">Start date</FieldLabel>
							<FieldDescription>The first day of your trip</FieldDescription>
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
							<FieldLabel htmlFor="endDate">End date</FieldLabel>
							<FieldDescription>The last day of your trip</FieldDescription>
							<Input
								type="text"
								id="endDate"
								{...form.register("endDate")}
								aria-invalid={!!form.formState.errors.endDate}
								disabled={isPending}
							/>
							<FieldError>{form.formState.errors.endDate?.message}</FieldError>
						</Field>
					</section>
					<Field data-invalid={!!form.formState.errors.destination}>
						<FieldLabel htmlFor="destination">
							Destination (optional)
						</FieldLabel>
						<FieldDescription>
							Where are you going? This can help with suggestions
						</FieldDescription>
						<Input
							type="text"
							id="destination"
							{...form.register("destination")}
							aria-invalid={!!form.formState.errors.destination}
							disabled={isPending}
						/>
						<FieldError>
							{form.formState.errors.destination?.message}
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
