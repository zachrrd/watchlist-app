import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cn } from "@/lib/utils"

function Progress({
  className,
  children,
  value,
  ...props
}: ProgressPrimitive.Root.Props) {
  const numericValue = typeof value === "number" && Number.isFinite(value) ? value : 0
  const clampedValue = Math.min(100, Math.max(0, numericValue))

  return (
    <ProgressPrimitive.Root
      value={clampedValue}
      data-slot="progress"
      className={cn("relative flex w-full overflow-hidden rounded-full bg-slate-800 h-2", className)}
      {...props}
    >
      {children}
      <ProgressTrack className="h-full w-full bg-slate-800">
        <ProgressIndicator className="h-full bg-indigo-500 transition-all duration-300" />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  )
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "relative flex h-full w-full items-center overflow-hidden rounded-full bg-slate-800",
        className
      )}
      data-slot="progress-track"
      {...props}
    />
  )
}

function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn("h-full bg-indigo-500 transition-all duration-300", className)}
      {...props}
    />
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn("text-sm font-medium text-slate-300", className)}
      data-slot="progress-label"
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn(
        "ml-auto text-sm text-slate-400 tabular-nums",
        className
      )}
      data-slot="progress-value"
      {...props}
    />
  )
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}
