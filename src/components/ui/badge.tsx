import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center text-xs font-medium",
  {
    variants: {
      variant: {
        default:
          "bg-black text-white dark:bg-white dark:text-black",
        secondary:
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
        destructive:
          "bg-red-500 text-white dark:bg-red-600",
        outline:
          "border border-black text-black dark:border-white dark:text-white",
        brand:
          "bg-brand-300 text-black",
      },
      size: {
        default: "px-2.5 py-0.5",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 