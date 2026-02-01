"use client"

import Link from "next/link"
import { ViewTransition } from "react"
import { useTranslation } from "react-i18next"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Divider } from "@/components/ui/divider"
import { Disclaimer } from "./disclaimer"

export function Landing() {
	const { t } = useTranslation()
	return (
		<>
			<Header />
			<ViewTransition>
				<main className="flex flex-col items-center justify-center min-h-screen py-2">
					<section className="flex flex-col items-center justify-start gap-6 p-1 max-w-xs">
						<section className="flex flex-col items-center justify-center gap-1">
							<h1 className="text-4xl font-bold text-center">Holiyay</h1>
							<h2 className="text-xl font-medium text-neutral-300 text-center">
								{t("landing:subheader")}
							</h2>
						</section>
						<section className="flex flex-col items-stretch justify-stretch w-full px-1 gap-1">
							<Link href="/auth/login" passHref className="contents">
								<Button size="lg">{t("landing:sign_in")}</Button>
							</Link>
							<Divider>{t("landing:or")}</Divider>
							<Link href="/auth/register" passHref className="contents">
								<Button size="lg">{t("landing:sign_up")}</Button>
							</Link>
						</section>
						<section className="pt-4 text-sm text-center text-neutral-600">
							<p>{t("landing:placeholder")}</p>
							<Disclaimer />
						</section>
					</section>
				</main>
			</ViewTransition>
		</>
	)
}
