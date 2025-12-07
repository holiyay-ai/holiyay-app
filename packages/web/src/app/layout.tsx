import type { Metadata } from "next"
import "./globals.css"
import localFont from "next/font/local"
import { ThemeProvider } from "@/components/theme-provider"

const MiSans = localFont({
	src: [
		{
			path: "./assets/fonts/MiSans/MiSans-Thin.woff2",
			weight: "100",
			style: "normal",
		},
		{
			path: "./assets/fonts/MiSans/MiSans-ExtraLight.woff2",
			weight: "200",
			style: "normal",
		},
		{
			path: "./assets/fonts/MiSans/MiSans-Light.woff2",
			weight: "300",
			style: "normal",
		},
		{
			path: "./assets/fonts/MiSans/MiSans-Regular.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "./assets/fonts/MiSans/MiSans-Medium.woff2",
			weight: "500",
			style: "normal",
		},
		{
			path: "./assets/fonts/MiSans/MiSans-Semibold.woff2",
			weight: "600",
			style: "normal",
		},
		{
			path: "./assets/fonts/MiSans/MiSans-Bold.woff2",
			weight: "700",
			style: "normal",
		},
		{
			path: "./assets/fonts/MiSans/MiSans-Demibold.woff2",
			weight: "800",
			style: "normal",
		},
		{
			path: "./assets/fonts/MiSans/MiSans-Heavy.woff2",
			weight: "900",
			style: "normal",
		},
	],
})

export const metadata: Metadata = {
	title: "Holiyay",
	description: "AI-assisted collaborative holiday planning",
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" className={MiSans.className} suppressHydrationWarning>
			<body>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					{children}
				</ThemeProvider>
			</body>
		</html>
	)
}
