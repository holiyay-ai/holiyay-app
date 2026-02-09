"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { useCallback, ViewTransition } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/auth-context"
import type { Locale } from "@/lib/i18n/i18n"
import { useLocale } from "@/lib/i18n/use-locale"
import { cn } from "@/lib/utils"
import type { AuthUser } from "@/types"
import { LanguageSelector } from "./language-selector"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu"

function userAsPlaceholderIcon(user: AuthUser) {
	if (user.name) {
		return user.name.charAt(0).toUpperCase()
	}
	if (user.email) {
		return user.email.charAt(0).toUpperCase()
	}
	return "?"
}

export function AppMenu() {
	const { user, isAuthenticated, logout } = useAuth()
	const { t } = useTranslation()

	if (!isAuthenticated || !user)
		return (
			<ViewTransition>
				<LanguageSelector />
			</ViewTransition>
		)

	return (
		<ViewTransition>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button size="icon" variant="ghost" className="rounded-full">
						<Avatar>
							{user.avatarUrl && (
								<AvatarImage
									src={user.avatarUrl}
									alt={user.name || user.email}
								/>
							)}
							<AvatarFallback>{userAsPlaceholderIcon(user)}</AvatarFallback>
						</Avatar>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>
						{t("common:app_menu.my_holiyay")}
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
					<DropdownMenuItem disabled>
						{t("common:app_menu.account_settings")}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<ThemeMenu />
					<LanguageMenu />
					<DropdownMenuSeparator />
					<Link href="/terms" passHref>
						<DropdownMenuItem>
							{t("common:app_menu.terms_of_service")}
						</DropdownMenuItem>
					</Link>
					<Link href="/privacy" passHref>
						<DropdownMenuItem>
							{t("common:app_menu.privacy_policy")}
						</DropdownMenuItem>
					</Link>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={logout}>
						{t("common:app_menu.logout")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</ViewTransition>
	)
}

function ThemeMenu() {
	const { setTheme, theme } = useTheme()
	const { t } = useTranslation()
	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>{t("common:theme.label")}</DropdownMenuSubTrigger>
			<DropdownMenuPortal>
				<DropdownMenuSubContent>
					<DropdownMenuItem
						onSelect={(e) => e.preventDefault()}
						onClick={() => setTheme("system")}
						className={cn(
							theme === "system" && "bg-accent text-accent-foreground",
						)}
					>
						{t("common:theme.system")}
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={(e) => e.preventDefault()}
						onClick={() => setTheme("light")}
						className={cn(
							theme === "light" && "bg-accent text-accent-foreground",
						)}
					>
						{t("common:theme.light")}
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={(e) => e.preventDefault()}
						onClick={() => setTheme("dark")}
						className={cn(
							theme === "dark" && "bg-accent text-accent-foreground",
						)}
					>
						{t("common:theme.dark")}
					</DropdownMenuItem>
				</DropdownMenuSubContent>
			</DropdownMenuPortal>
		</DropdownMenuSub>
	)
}

function LanguageMenu() {
	const { locale, setLocale } = useLocale()
	const { t } = useTranslation()
	const handleChange = useCallback(
		(locale: Locale) => {
			setLocale(locale)
		},
		[setLocale],
	)
	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>{t("common:language")}</DropdownMenuSubTrigger>
			<DropdownMenuPortal>
				<DropdownMenuSubContent>
					<DropdownMenuItem
						onSelect={(e) => e.preventDefault()}
						onClick={() => handleChange("en")}
						className={cn(
							locale === "en" && "bg-accent text-accent-foreground",
						)}
					>
						English
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={(e) => e.preventDefault()}
						onClick={() => handleChange("no")}
						className={cn(
							locale === "no" && "bg-accent text-accent-foreground",
						)}
					>
						Norsk
					</DropdownMenuItem>
				</DropdownMenuSubContent>
			</DropdownMenuPortal>
		</DropdownMenuSub>
	)
}
