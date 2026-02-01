"use client"

import { ChevronDownIcon } from "lucide-react"
import Image from "next/image"
import { useCallback, useTransition } from "react"
import { useTranslation } from "react-i18next"
import type { Locale } from "@/lib/i18n/i18n"
import { useLocale } from "@/lib/i18n/use-locale"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu"

function localeToEmoji(locale: string) {
	switch (locale) {
		case "en":
			// Prefer GB
			return "🇬🇧"
		case "no":
			return "🇳🇴"
		default:
			return "🌐"
	}
}

function localeToLabel(locale: string, t: (k: string) => string) {
	switch (locale) {
		case "en":
			return "English"
		case "no":
			return "Norsk"
		default:
			return t("common:language")
	}
}

function emojiToCodepoint(emoji: string) {
	return (
		Array.from(emoji)
			// biome-ignore lint/style/noNonNullAssertion: To be always present
			.map((ch) => ch.codePointAt(0)!.toString(16))
			.join("-")
	)
}

function Twemoji({
	emoji,
	label,
	className,
}: {
	emoji?: string
	label?: string
	className?: string
}) {
	if (!emoji) return null
	const cp = emojiToCodepoint(emoji)
	const svg = `https://twemoji.maxcdn.com/v/latest/svg/${cp}.svg`
	const png = `https://twemoji.maxcdn.com/v/latest/72x72/${cp}.png`

	return (
		<Image
			src={svg}
			alt={label ?? emoji}
			title={label ?? emoji}
			className={cn("inline-block h-4 w-4 shrink-0", className)}
			width={16}
			height={16}
			loading="lazy"
			decoding="async"
			onError={(e) => {
				// fallback to PNG if SVG fails
				const el = e.currentTarget as HTMLImageElement
				if (!el.src.endsWith(".png")) el.src = png
			}}
		/>
	)
}

export function LanguageSelector() {
	const { locale, setLocale } = useLocale()
	const { t } = useTranslation()
	const [isPending, startTransition] = useTransition()
	// biome-ignore lint/correctness/useExhaustiveDependencies: Ignore isPending to prevent infinite loop
	const handleChange = useCallback(
		(locale: Locale) => {
			if (isPending) return
			startTransition(() => {
				setTimeout(() => {
					setLocale(locale)
				}, 300)
			})
		},
		[setLocale],
	)
	const emoji = localeToEmoji(locale)
	const label = localeToLabel(locale, t)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Button variant="outline">
					{emoji ? <Twemoji emoji={emoji} label={label} /> : null}
					<ChevronDownIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuPortal>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						disabled={isPending}
						onClick={() => handleChange("en")}
						className={cn(
							locale === "en" && "bg-accent text-accent-foreground",
						)}
					>
						English
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={isPending}
						onClick={() => handleChange("no")}
						className={cn(
							locale === "no" && "bg-accent text-accent-foreground",
						)}
					>
						Norsk
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenuPortal>
		</DropdownMenu>
	)
}
