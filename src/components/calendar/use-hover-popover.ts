import { useCallback, useEffect, useRef, useState } from "react"

export function useHoverPopover(closeDelay = 500) {
	const [open, setOpen] = useState(false)
	const closeRef = useRef<number | null>(null)
	const isInsideRef = useRef(false)
	// Track last open/close times to avoid immediate reopen loops
	const lastCloseAtRef = useRef<number | null>(null)
	const lastOpenAtRef = useRef<number | null>(null)

	const openPopover = useCallback(() => {
		const now = Date.now()
		// If we just closed very recently, ignore very-immediate re-opens to
		// avoid rapid close/open loops when quickly entering/leaving.
		if (lastCloseAtRef.current && now - lastCloseAtRef.current < 150) {
			return
		}
		if (closeRef.current) {
			clearTimeout(closeRef.current)
			closeRef.current = null
		}
		// mark pointer as inside (so close timer won't hide the popover)
		isInsideRef.current = true
		lastOpenAtRef.current = now
		setOpen(true)
	}, [])

	const closePopoverDelayed = useCallback(() => {
		// mark pointer as not inside and schedule close; if pointer re-enters
		// before the timeout fires, openPopover() will cancel the scheduled close.
		isInsideRef.current = false
		if (closeRef.current) clearTimeout(closeRef.current)

		// If the popover was opened very recently, extend the close delay slightly
		// so quick enter/leave (twitchy cursor) doesn't cause a visible flicker.
		const now = Date.now()
		const sinceOpen = lastOpenAtRef.current
			? now - lastOpenAtRef.current
			: Infinity
		const reopenGuard = 150 // ms
		const extra = sinceOpen < reopenGuard ? reopenGuard - sinceOpen : 0
		const effectiveDelay = closeDelay + extra

		closeRef.current = window.setTimeout(() => {
			// If pointer has re-entered, cancel closing
			if (isInsideRef.current) {
				closeRef.current = null
				return
			}
			setOpen(false)
			// record time of close so we can ignore very-immediate re-opens
			lastCloseAtRef.current = Date.now()
			closeRef.current = null
		}, effectiveDelay)
	}, [closeDelay])

	useEffect(() => {
		return () => {
			if (closeRef.current) clearTimeout(closeRef.current)
		}
	}, [])

	return { open, setOpen, openPopover, closePopoverDelayed }
}
