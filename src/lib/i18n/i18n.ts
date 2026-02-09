import { acceptsLanguages } from "@std/http/negotiation"
import { cookies, headers } from "next/headers"

export const SUPPORTED_LOCALES = ["en", "no"] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = "en"

export function detectLocaleFromAcceptLanguage(header?: string): Locale {
	if (!header) return DEFAULT_LOCALE
	const languages = acceptsLanguages({
		headers: new Headers({ "accept-language": header }),
	})
	const supportedLanguages = languages.filter((lang) =>
		SUPPORTED_LOCALES.includes(lang as Locale),
	) as Locale[]
	return supportedLanguages[0] || DEFAULT_LOCALE
}

export async function getLocaleFromServer(): Promise<Locale> {
	const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value
	if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as Locale)) {
		return cookieLocale as Locale
	}
	const header = (await headers()).get("accept-language") ?? ""
	return detectLocaleFromAcceptLanguage(header)
}

export async function loadTranslations(
	locale: Locale,
	namespaces: string[] = [
		"common",
		"landing",
		"auth",
		"terms",
		"privacy",
		"calendar",
	],
) {
	const res: Record<string, any> = {}
	for (const namespace of namespaces) {
		try {
			const mod = await import(`@/locales/${namespace}/${locale}.json`)
			res[namespace] = mod.default ?? mod
		} catch {
			res[namespace] = {}
		}
	}
	return res
}
