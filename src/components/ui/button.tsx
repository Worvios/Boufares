import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-base font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-primary/40 shadow-sm hover:shadow-md",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 text-white shadow-md hover:from-blue-600 hover:to-violet-600 focus-visible:ring-2 focus-visible:ring-blue-400",
        destructive:
          "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md hover:from-red-600 hover:to-pink-600 focus-visible:ring-2 focus-visible:ring-red-400",
        outline:
          "border-2 border-blue-400 bg-white text-blue-700 hover:bg-blue-50 hover:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-300",
        secondary:
          "bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-md hover:from-teal-500 hover:to-cyan-600 focus-visible:ring-2 focus-visible:ring-cyan-300",
        ghost:
          "bg-transparent text-blue-600 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-200",
        link: "text-indigo-600 underline-offset-4 hover:underline hover:text-indigo-800",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 rounded-md gap-1.5 px-4 py-1.5 text-sm",
        lg: "h-12 rounded-lg px-8 py-3 text-lg",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
