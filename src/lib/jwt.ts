import * as jwt from "jsonwebtoken"

export function isJwtExpired(
	token?: string | null,
	treatMissingExpAsExpired = true,
): boolean {
	if (!token) return true
	try {
		const decoded = jwt.decode(token) as jwt.JwtPayload | null
		if (!decoded) return true
		const rawExp = decoded.exp
		if (rawExp == null) return treatMissingExpAsExpired
		const exp = Number(rawExp)
		if (!Number.isFinite(exp)) return true
		const currentTime = Math.floor(Date.now() / 1000)
		return currentTime >= exp
	} catch (err) {
		console.error("Error decoding JWT:", err)
		return true
	}
}
