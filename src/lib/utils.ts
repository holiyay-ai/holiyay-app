import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function parseSetCookie(header: string) {
	const parts = header.split(";").map((p) => p.trim())
	const [nameValue, ...attrs] = parts
	const [name, ...valueParts] = (nameValue || "=").split("=")
	const value = valueParts.join("=")

	const parsed: {
		name?: string | undefined
		value?: string
		path?: string
		domain?: string
		maxAge?: number
		expires?: Date
		secure?: boolean
		httpOnly?: boolean
		sameSite?: "lax" | "strict" | "none"
	} = { name, value }

	for (const attr of attrs) {
		const [k, ...vParts] = attr.split("=")
		const lowerK = k?.toLowerCase()
		const v = vParts.join("=")
		if (lowerK === "path") parsed.path = v
		else if (lowerK === "domain") parsed.domain = v
		else if (lowerK === "max-age") parsed.maxAge = Number(v)
		else if (lowerK === "expires") parsed.expires = new Date(v)
		else if (lowerK === "secure") parsed.secure = true
		else if (lowerK === "httponly") parsed.httpOnly = true
		else if (lowerK === "samesite") {
			const s = v.toLowerCase()
			parsed.sameSite =
				s === "none" ? "none" : s === "strict" ? "strict" : "lax"
		}
	}

	return parsed
}
