"use client"
import i18next from "i18next"
import type React from "react"
import { useEffect } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"

type Props = {
	locale: string
	translations: Record<string, Record<string, string>>
	children: React.ReactNode
}

function initI18n(
	locale: string,
	translations: Record<string, Record<string, string>>,
) {
	if (!i18next.isInitialized) {
		i18next.use(initReactI18next).init({
			resources: { [locale]: translations },
			lng: locale,
			fallbackLng: "en",
			interpolation: { escapeValue: false },
			react: { useSuspense: false },
		})
	}
}

export default function I18nProvider({
	locale,
	translations,
	children,
}: Props) {
	initI18n(locale, translations)

	// Handle subsequent locale changes in useEffect
	useEffect(() => {
		Object.entries(translations).forEach(([ns, msgs]) => {
			i18next.addResourceBundle(locale, ns, msgs, true, true)
		})
		i18next.changeLanguage(locale)
	}, [locale, translations])

	return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
}
