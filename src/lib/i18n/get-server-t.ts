import { getLocaleFromServer, loadTranslations } from "./i18n"

export default async function getTranslation(ns?: string) {
	const locale = await getLocaleFromServer()
	return await loadTranslations(locale, ns ? [ns] : undefined)
}
