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

export default function I18nProvider({
	locale,
	translations,
	children,
}: Props) {
	useEffect(() => {
		// init once
		if (!i18next.isInitialized) {
			i18next.use(initReactI18next).init({
				resources: { [locale]: translations },
				lng: locale,
				fallbackLng: "en",
				interpolation: { escapeValue: false },
				react: { useSuspense: false },
			})
			return
		}

		// subsequent locale changes: add bundles and change language
		Object.entries(translations).forEach(([ns, msgs]) => {
			if (!i18next.hasResourceBundle(locale, ns)) {
				i18next.addResourceBundle(locale, ns, msgs, true, true)
			} else {
				i18next.addResourceBundle(locale, ns, msgs, true, true)
			}
		})
		i18next.changeLanguage(locale)
	}, [locale, translations])

	return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
}
