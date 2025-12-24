"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { loginAction } from "@/actions/login-action"
import { registerAction } from "@/actions/register-action"
import { loginSchema, registerSchema } from "@/api/lib/schemas"
import { GoogleIcon } from "@/assets/google-icon.svg"
import { useAuth } from "@/lib/auth-context"
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
	function onClick() {
		// Redirect to server-side OAuth endpoint which will forward to Supabase
		window.location.assign(`/api/auth/oauth/google`)
	}

	return (
		<Button
			size="lg"
			className="w-full"
			onClick={onClick}
			disabled={disabled}
			aria-label="Sign in with Google"
		>
			<GoogleIcon />
			Sign in with Google
		</Button>
	)
}

function SignUpWithGoogleButton({ disabled }: { disabled?: boolean }) {
	function onClick() {
		window.location.assign(`/api/auth/oauth/google`)
	}

	return (
		<Button
			size="lg"
			className="w-full"
			onClick={onClick}
			disabled={disabled}
			aria-label="Sign up with Google"
		>
			<GoogleIcon />
			Sign up with Google
		</Button>
	)
}

function LoginForm() {
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
				<CardTitle>Login into Holiyay</CardTitle>
			</CardHeader>
			<CardContent>
				<SignInWithGoogleButton disabled={isPending} />
				<Divider>Or</Divider>
				<form onSubmit={onSubmit}>
					<FieldGroup>
						<Field data-invalid={!!form.formState.errors.email}>
							<FieldLabel htmlFor="email">Email</FieldLabel>
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
							<FieldLabel htmlFor="password">Password</FieldLabel>
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
								Login
							</Button>
						</Field>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter>
				<Link href="/auth?type=register" passHref className="contents">
					<Button variant="ghost" className="w-full" disabled={isPending}>
						Create an account
					</Button>
				</Link>
			</CardFooter>
		</Card>
	)
}

function RegisterForm() {
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
				<CardTitle>Create an account for Holiyay</CardTitle>
			</CardHeader>
			<CardContent>
				<SignUpWithGoogleButton disabled={isPending} />
				<Divider>Or</Divider>
				<form onSubmit={onSubmit}>
					<FieldGroup>
						<Field data-invalid={!!form.formState.errors.name}>
							<FieldLabel htmlFor="name">Name</FieldLabel>
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
							<FieldLabel htmlFor="email">Email</FieldLabel>
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
							<FieldLabel htmlFor="password">Password</FieldLabel>
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
								Create Account
							</Button>
						</Field>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter>
				<Link href="/auth?type=login" passHref className="contents">
					<Button variant="ghost" className="w-full" disabled={isPending}>
						Already have an account? Login
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
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button type="button" variant="secondary" disabled={disabled}>
					Forgot Password?
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Reset your password</DialogTitle>
					<DialogDescription>
						Enter your email address below and we'll send you a link to reset
						your password.
					</DialogDescription>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="email">Email</FieldLabel>
						<Input type="email" id="email" name="email" />
					</Field>
				</FieldGroup>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline" type="button">
							Cancel
						</Button>
					</DialogClose>
					<DialogClose asChild>
						<Button type="button">Send reset email</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
