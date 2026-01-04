"use server"

export async function getSessionCookie(): Promise<string> {
	throw new Error(
		"getSessionCookie is disabled for security reasons. Use getCurrentUser() instead which does not expose tokens to client code.",
	)
}
