"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { loginAction } from "@/actions/login-action"
import { registerAction } from "@/actions/register-action"
import { GoogleIcon } from "@/assets/google-icon.svg"
import { useAuth } from "@/lib/auth-context"
import { loginSchema, registerSchema } from "@/lib/schemas"
import { createClient } from "@/lib/supabase/client"
import { GridBackground } from "./grid-background"
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog"
import { Divider } from "./ui/divider"
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field"
import { Input } from "./ui/input"
import { Spinner } from "./ui/spinner"

type AuthFormProps = {
	type: "login" | "register"
}
export function AuthForm({ type }: AuthFormProps) {
	const Form = type === "login" ? <LoginForm /> : <RegisterForm />
	return (
		<>
			<GridBackground />
			{Form}
		</>
	)
}

function SignInWithGoogleButton({ disabled }: { disabled?: boolean }) {
	const { t } = useTranslation("auth")

	const onClick = async () => {
		const supabase = createClient()

		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${window.location.origin}/auth/callback?next=/`,
			},
		})
		if (error) {
			toast.error(error.message)
		}
	}

	return (
		<Button
			size="lg"
			className="w-full"
			onClick={onClick}
			disabled={disabled}
			aria-label={t("login.sso_google")}
		>
			<GoogleIcon />
			{t("login.sso_google")}
		</Button>
	)
}

function SignUpWithGoogleButton({ disabled }: { disabled?: boolean }) {
	const { t } = useTranslation("auth")
	const onClick = async () => {
		const supabase = createClient()
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${window.location.origin}/auth/callback?next=/`,
			},
		})
		if (error) {
			toast.error(error.message)
		}
	}

	return (
		<Button
			size="lg"
			className="w-full"
			onClick={onClick}
			disabled={disabled}
			aria-label={t("register.sso_google")}
		>
			<GoogleIcon />
			{t("register.sso_google")}
		</Button>
	)
}

function LoginForm() {
	const { t } = useTranslation("auth")
	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		mode: "onBlur",
		resolver: zodResolver(loginSchema),
	})
	const [isPending, startTransition] = useTransition()
	const auth = useAuth()
	const router = useRouter()

	const onSubmit = form.handleSubmit(async (data) => {
		startTransition(async () => {
			const result = await loginAction(data.email, data.password)
			if (result.data) {
				await auth.refreshUser()
				router.push("/")
			} else {
				toast.error(result.error.message)
			}
		})
	})

	return (
		<Card className="min-w-[320px]">
			<CardHeader>
				<CardTitle>{t("login.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				<SignInWithGoogleButton disabled={isPending} />
				<Divider>{t("or")}</Divider>
				<form onSubmit={onSubmit}>
					<FieldGroup>
						<Field data-invalid={!!form.formState.errors.email}>
							<FieldLabel htmlFor="email">{t("login.fields.email")}</FieldLabel>
							<Input
								type="email"
								id="email"
								{...form.register("email")}
								aria-invalid={!!form.formState.errors.email}
								disabled={isPending}
							/>
							<FieldError>{form.formState.errors.email?.message}</FieldError>
						</Field>
						<Field data-invalid={!!form.formState.errors.password}>
							<FieldLabel htmlFor="password">
								{t("login.fields.password")}
							</FieldLabel>
							<Input
								type="password"
								id="password"
								{...form.register("password")}
								aria-invalid={!!form.formState.errors.password}
								disabled={isPending}
							/>
							<FieldError>{form.formState.errors.password?.message}</FieldError>
						</Field>
						<Field orientation="horizontal" className="w-full">
							<ForgotPasswordDialog disabled={isPending} />
							<Button disabled={isPending} type="submit" className="grow">
								{isPending && <Spinner />}
								{t("login.login")}
							</Button>
						</Field>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter>
				<Link href="/auth/register" passHref className="contents">
					<Button variant="ghost" className="w-full" disabled={isPending}>
						{t("login.register_cta")}
					</Button>
				</Link>
			</CardFooter>
		</Card>
	)
}

function RegisterForm() {
	const { t } = useTranslation("auth")
	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
		mode: "onBlur",
		resolver: zodResolver(registerSchema),
	})
	const [isPending, startTransition] = useTransition()
	const auth = useAuth()
	const router = useRouter()

	const onSubmit = form.handleSubmit(async (data) => {
		startTransition(async () => {
			const result = await registerAction(data.name, data.email, data.password)
			if (result.data) {
				if (result.data.code === "EMAIL_VERIFICATION_REQUIRED") {
					toast.success(
						`Sign up successful. Please check your email ${result.data.user.email} to verify your account in order to sign in.`,
					)
					return
				}
				await auth.refreshUser()
				router.push("/")
			} else {
				toast.error(result.error.message)
			}
		})
	})

	return (
		<Card className="min-w-[320px]">
			<CardHeader>
				<CardTitle>{t("register.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				<SignUpWithGoogleButton disabled={isPending} />
				<Divider>{t("or")}</Divider>
				<form onSubmit={onSubmit}>
					<FieldGroup>
						<Field data-invalid={!!form.formState.errors.name}>
							<FieldLabel htmlFor="name">
								{t("register.fields.name")}
							</FieldLabel>
							<Input
								type="text"
								id="name"
								{...form.register("name")}
								aria-invalid={!!form.formState.errors.name}
								disabled={isPending}
							/>
							<FieldError>{form.formState.errors.name?.message}</FieldError>
						</Field>
						<Field data-invalid={!!form.formState.errors.email}>
							<FieldLabel htmlFor="email">
								{t("register.fields.email")}
							</FieldLabel>
							<Input
								type="email"
								id="email"
								{...form.register("email")}
								aria-invalid={!!form.formState.errors.email}
								disabled={isPending}
							/>
							<FieldError>{form.formState.errors.email?.message}</FieldError>
						</Field>
						<Field data-invalid={!!form.formState.errors.password}>
							<FieldLabel htmlFor="password">
								{t("register.fields.password")}
							</FieldLabel>
							<Input
								type="password"
								id="password"
								{...form.register("password")}
								aria-invalid={!!form.formState.errors.password}
								disabled={isPending}
							/>
							<FieldError>{form.formState.errors.password?.message}</FieldError>
						</Field>
						<Field orientation="horizontal" className="w-full">
							<Button type="submit" className="grow" disabled={isPending}>
								{isPending && <Spinner />}
								{t("register.register")}
							</Button>
						</Field>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter>
				<Link href="/auth/login" passHref className="contents">
					<Button variant="ghost" className="w-full" disabled={isPending}>
						{t("register.login_cta")}
					</Button>
				</Link>
			</CardFooter>
		</Card>
	)
}

type ForgotPasswordDialogProps = {
	disabled?: boolean
}
function ForgotPasswordDialog({ disabled }: ForgotPasswordDialogProps) {
	const { t } = useTranslation("auth")
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button type="button" variant="secondary" disabled={disabled}>
					{t("forgot_password.cta")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("forgot_password.title")}</DialogTitle>
					<DialogDescription>
						{t("forgot_password.description")}
					</DialogDescription>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="email">
							{t("forgot_password.fields.email")}
						</FieldLabel>
						<Input type="email" id="email" name="email" />
					</Field>
				</FieldGroup>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline" type="button">
							{t("forgot_password.cancel")}
						</Button>
					</DialogClose>
					<DialogClose asChild>
						<Button type="button">{t("forgot_password.submit")}</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
