"use client"

import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  { id: "analyzing", label: "Analyzing query" },
  { id: "searching", label: "Searching PubMed" },
  { id: "fetching", label: "Fetching abstracts" },
  { id: "analyzing_papers", label: "Analyzing papers" },
  { id: "generating", label: "Generating answer" },
]

interface LoadingProgressProps {
  currentStep: string | null
}

export function LoadingProgress({ currentStep }: LoadingProgressProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <div className="mt-12 flex justify-center">
      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const isCompleted = currentIndex > i
          const isActive = currentIndex === i
          const isPending = currentIndex < i

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted && "border-teal bg-teal text-white",
                  isActive && "border-teal",
                  isPending && "border-border/60"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : isActive ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-teal" />
                ) : null}
              </div>
              <span
                className={cn(
                  "text-sm transition-colors",
                  isCompleted && "text-muted-foreground",
                  isActive && "font-medium text-foreground",
                  isPending && "text-muted-foreground/50"
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
