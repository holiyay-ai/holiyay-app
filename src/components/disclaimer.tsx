"use client"

import Link from "next/link"
import { Trans, useTranslation } from "react-i18next"

export function Disclaimer() {
	const { i18n } = useTranslation()
	return (
		<Trans i18n={i18n} ns="auth" i18nKey="disclaimer" parent="p">
			<Link href="/terms" className="underline">
				Terms of Service
			</Link>
			<Link href="/privacy" className="underline">
				Privacy Policy
			</Link>
		</Trans>
	)
}
