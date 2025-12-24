import * as jwt from "jsonwebtoken"

export function checkIfExpired(token: string | null | undefined): boolean {
	try {
		if (!token) {
			return true
		}
		const decoded = jwt.decode(token) as { exp: number } | null
		if (!decoded || !decoded.exp) {
			return true
		}
		const currentTime = Math.floor(Date.now() / 1000)
		return decoded.exp < currentTime
	} catch (error) {
		console.error("Error decoding JWT:", error)
		return true
	}
}
