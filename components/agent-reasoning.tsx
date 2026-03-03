"use client"

import { useState } from "react"
import {
  Brain,
  Search,
  CheckCircle,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface AgentReasoningStep {
  step: string
  action: string
  result: string
  timestamp?: number
}

interface AgentReasoningProps {
  steps: AgentReasoningStep[]
  isRunning: boolean
}

const stepConfig: Record<string, { icon: typeof Brain; color: string; label: string }> = {
  planning: {
    icon: Brain,
    color: "text-violet-500",
    label: "Planning",
  },
  searching: {
    icon: Search,
    color: "text-blue-500",
    label: "Searching",
  },
  evaluating: {
    icon: CheckCircle,
    color: "text-amber-500",
    label: "Evaluating",
  },
  refining: {
    icon: RefreshCw,
    color: "text-orange-500",
    label: "Refining",
  },
  synthesizing: {
    icon: Sparkles,
    color: "text-emerald-500",
    label: "Synthesizing",
  },
}

const defaultStepConfig = {
  icon: Brain,
  color: "text-muted-foreground",
  label: "Processing",
}

export function AgentReasoning({ steps, isRunning }: AgentReasoningProps) {
  const [isOpen, setIsOpen] = useState(true)

  if (steps.length === 0 && !isRunning) return null

  return (
    <div className="rounded-xl border border-border/50 bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left sm:px-5"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center rounded-lg bg-violet-500/10 p-1.5">
            <Brain className="size-4 text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Deep Research Agent
            </h3>
            <p className="text-xs text-muted-foreground">
              {isRunning
                ? `${steps.length} steps completed...`
                : `${steps.length} reasoning steps`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="flex gap-1">
              <span className="size-1.5 animate-pulse rounded-full bg-violet-500" />
              <span className="size-1.5 animate-pulse rounded-full bg-violet-500 [animation-delay:150ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-violet-500 [animation-delay:300ms]" />
            </div>
          )}
          {isOpen ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isOpen && steps.length > 0 && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 sm:px-5">
          <div className="relative ml-3">
            {/* Timeline line */}
            <div className="absolute left-0 top-0 h-full w-px bg-border/50" />

            <div className="flex flex-col gap-3">
              {steps.map((step, i) => {
                const config = stepConfig[step.step] || defaultStepConfig
                const Icon = config.icon
                const isLast = i === steps.length - 1

                return (
                  <div key={i} className="relative flex gap-3 pl-5">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        "absolute -left-[5px] top-1 flex size-[11px] items-center justify-center rounded-full border-2 border-background",
                        isLast && isRunning
                          ? "animate-pulse bg-violet-500"
                          : "bg-border"
                      )}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("size-3.5 shrink-0", config.color)} />
                        <span className={cn("text-xs font-medium", config.color)}>
                          {config.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {step.action}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {step.result}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
