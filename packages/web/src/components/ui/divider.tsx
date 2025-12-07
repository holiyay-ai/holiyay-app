import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"

import { cn } from "../../lib/utils"

const dividerVariants = cva("flex items-center w-full py-2", {
	variants: {
		labelPosition: {
			left: "",
			center: "",
			right: "",
		},
	},
	defaultVariants: {
		labelPosition: "center",
	},
})

const lineStyles = "flex-1 border-t border-neutral-300 dark:border-neutral-700"

function Divider({
	className,
	labelPosition = "center",
	children,
	...props
}: React.ComponentProps<"div"> &
	VariantProps<typeof dividerVariants> & {
		children?: React.ReactNode
	}) {
	if (!children) {
		return (
			<div
				data-slot="divider"
				className={cn(
					"w-full border-t border-neutral-300 dark:border-neutral-700",
					className,
				)}
				role="separator"
				aria-valuenow={0}
				tabIndex={0}
				{...props}
			/>
		)
	}

	return (
		<div
			data-slot="divider"
			className={cn(dividerVariants({ labelPosition, className }))}
			role="separator"
			aria-valuenow={0}
			tabIndex={0}
			{...props}
		>
			{labelPosition === "left" ? (
				<>
					<span className="text-xs text-neutral-600 dark:text-neutral-400 shrink-0 pr-3">
						{children}
					</span>
					<div className={lineStyles} />
				</>
			) : labelPosition === "right" ? (
				<>
					<div className={lineStyles} />
					<span className="text-xs text-neutral-600 dark:text-neutral-400 shrink-0 pl-3">
						{children}
					</span>
				</>
			) : (
				<>
					<div className={lineStyles} />
					<span className="text-xs text-neutral-600 dark:text-neutral-400 shrink-0 px-3">
						{children}
					</span>
					<div className={lineStyles} />
				</>
			)}
		</div>
	)
}

export { Divider, dividerVariants }
