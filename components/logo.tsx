import Link from "next/link"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({
  className,
  href = "/",
  showText = true,
}: {
  className?: string
  href?: string
  showText?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 font-heading", className)}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Plus className="size-5" strokeWidth={3} />
      </span>
      {showText && (
        <span className="text-lg font-bold tracking-tight">
          Medi<span className="text-primary">Sync</span>
        </span>
      )}
    </Link>
  )
}
