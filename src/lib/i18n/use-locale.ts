"use client"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

const LOCALE_COOKIE = "NEXT_LOCALE"
const MAX_AGE = 60 * 60 * 24 * 365

export function useLocale() {
	const { i18n } = useTranslation()
	const router = useRouter()
	const [locale, setLocaleState] = useState(() => i18n?.language ?? "en")

	useEffect(() => {
		const onChange = (lng: string) => setLocaleState(lng)
		i18n?.on?.("languageChanged", onChange)
		setLocaleState(i18n?.language ?? i18n?.resolvedLanguage ?? "en")
		return () => i18n?.off?.("languageChanged", onChange)
	}, [i18n])

	const setLocale = useCallback(
		(lng: string, { refresh = true } = {}) => {
			// biome-ignore lint/suspicious/noDocumentCookie: To be evaluated later
			document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(lng)}; path=/; max-age=${MAX_AGE}; samesite=lax`
			void i18n.changeLanguage(lng)
			setLocaleState(lng)
			if (refresh) router.refresh()
		},
		[i18n, router],
	)

	return { locale, setLocale }
}
