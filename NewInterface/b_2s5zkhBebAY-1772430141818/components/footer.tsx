import Link from "next/link"
import { Brain } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 p-1">
            <Brain className="size-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Synapse AI
          </span>
        </div>

        <nav className="flex items-center gap-6" aria-label="Footer navigation">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Search
          </Link>
          <Link
            href="/how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </Link>
          <Link
            href="/faq"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </Link>
        </nav>

        <p className="text-xs text-muted-foreground/60">
          {new Date().getFullYear()} Synapse AI. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
