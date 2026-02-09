"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTimeout } from "@mantine/hooks"
import { useCallback, useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { postCalendarAction } from "@/actions/post-calendar"
import { useMutableSearchParams } from "@/lib/hooks"
import { createCalendarSchema } from "@/lib/schemas"
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
	const { t } = useTranslation()
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
					<DialogTitle>
						{t("calendar:create_plan.labels.create_new_plan")}
					</DialogTitle>
					<DialogDescription>
						{t("calendar:create_plan.bodies.create_new_plan")}
					</DialogDescription>
					<DialogClose type="button" onClick={onClose} />
				</DialogHeader>
				<FieldGroup>
					<Field data-invalid={!!form.formState.errors.name}>
						<FieldLabel htmlFor="name">
							{t("calendar:create_plan.fields.name")}
						</FieldLabel>
						<FieldDescription>
							{t("calendar:create_plan.descriptions.name")}
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
							<FieldLabel htmlFor="startDate">
								{t("calendar:create_plan.fields.start_date")}
							</FieldLabel>
							<FieldDescription>
								{t("calendar:create_plan.descriptions.start_date")}
							</FieldDescription>
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
							<FieldLabel htmlFor="endDate">
								{t("calendar:create_plan.fields.end_date")}
							</FieldLabel>
							<FieldDescription>
								{t("calendar:create_plan.descriptions.end_date")}
							</FieldDescription>
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
							{t("calendar:create_plan.fields.destination")}
						</FieldLabel>
						<FieldDescription>
							{t("calendar:create_plan.descriptions.destination")}
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
						{t("calendar:create_plan.actions.cancel")}
					</Button>
					<Button type="submit" disabled={isPending || !form.formState.isValid}>
						{isPending && <Spinner />}
						{t("calendar:create_plan.actions.create_plan")}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	)
}
