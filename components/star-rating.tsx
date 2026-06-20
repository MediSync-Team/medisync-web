import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function StarRating({
  rating,
  size = 16,
  showValue = false,
  count,
  className,
}: {
  rating: number
  size?: number
  showValue?: boolean
  count?: number
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.round(rating)
          return (
            <Star
              key={i}
              style={{ width: size, height: size }}
              className={cn(
                filled
                  ? "fill-warning text-warning"
                  : "fill-muted text-muted-foreground/30"
              )}
            />
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-foreground">
          {rating.toFixed(1)}
        </span>
      )}
      {typeof count === "number" && (
        <span className="text-sm text-muted-foreground">({count})</span>
      )}
      <span className="sr-only">{rating} / 5</span>
    </div>
  )
}
