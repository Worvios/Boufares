import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder:text-blue-300 transition-all duration-200",
        className
      )}
      {...props}
    />
  )
}

export { Input }
