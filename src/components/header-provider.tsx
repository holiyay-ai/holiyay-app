"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { Header } from "./header"

interface HeaderContextValue {
	hidden: boolean
	setHidden: React.Dispatch<React.SetStateAction<boolean>>
}

interface HeaderProviderProps {
	children: React.ReactNode
}

const HeaderContext = createContext<HeaderContextValue | undefined>(undefined)

export function HeaderProvider({ children }: HeaderProviderProps) {
	const [hidden, setHidden] = useState(false)

	return (
		<HeaderContext.Provider value={{ hidden, setHidden }}>
			<Header hidden={hidden} />
			{children}
		</HeaderContext.Provider>
	)
}

export function useHeaderContext() {
	const context = useContext(HeaderContext)
	if (!context) {
		throw new Error("useHeaderContext must be used within a HeaderProvider")
	}
	return context
}

export function HideHeaderEffect() {
	const { setHidden } = useHeaderContext()
	const setHiddenRef = useRef(setHidden)

	useEffect(() => {
		setHiddenRef.current(true)
		return () => {
			setHiddenRef.current(false)
		}
	}, [])

	return null
}
