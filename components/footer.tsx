"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Github, Linkedin, Twitter } from "lucide-react"
import { useState } from "react"

const exploreLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
  { label: "Search tool", href: "/search" },
]

const resourceLinks = [
  { label: "PubMed", href: "https://pubmed.ncbi.nlm.nih.gov/" },
  { label: "Google Gemini", href: "https://aistudio.google.com/app/apikey" },
  { label: "LangChain", href: "https://www.langchain.com/" },
  { label: "ChromaDB", href: "https://www.trychroma.com/" },
]

const socialLinks = [
  { label: "GitHub", href: "#", icon: Github },
  { label: "LinkedIn", href: "#", icon: Linkedin },
  { label: "Twitter", href: "#", icon: Twitter },
]

export function Footer() {
  const [email, setEmail] = useState("")

  return (
    <footer>
      {/* Newsletter Banner */}
      <div className="bg-frost-dark py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
            {/* Left - Headline */}
            <div className="lg:max-w-md">
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Stay ahead in
                <br />
                biomedical research
              </h2>
            </div>

            {/* Right - Form */}
            <div className="lg:max-w-lg">
              <p className="text-muted-foreground leading-relaxed">
                Get updates on new features, research tips, and improvements to Synapse AI.
                Be the first to know when we add new data sources and capabilities.
              </p>
              <form
                className="mt-6 flex gap-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  setEmail("")
                }}
              >
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 flex-1 rounded-md border-border bg-background"
                />
                <Button
                  type="submit"
                  className="h-12 rounded-md bg-teal px-6 text-foreground hover:bg-teal-hover"
                >
                  Submit
                </Button>
              </form>
              <p className="mt-3 text-sm text-muted-foreground">
                We only send useful updates — no spam, ever.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-foreground py-12 text-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Explore */}
            <div>
              <h4 className="text-sm font-medium uppercase tracking-wider text-background/60">
                Explore
              </h4>
              <ul className="mt-4 space-y-3">
                {exploreLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-background/80 transition-colors hover:text-background"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-medium uppercase tracking-wider text-background/60">
                Resources
              </h4>
              <ul className="mt-4 space-y-3">
                {resourceLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-background/80 transition-colors hover:text-background"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="text-sm font-medium uppercase tracking-wider text-background/60">
                Connect
              </h4>
              <ul className="mt-4 space-y-3">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-3 text-background/80 transition-colors hover:text-background"
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="text-sm font-medium uppercase tracking-wider text-background/60">
                About
              </h4>
              <p className="mt-4 text-background/80">
                Synapse AI is an open-source biomedical research assistant powered by PubMed and Google Gemini.
              </p>
              <p className="mt-4 text-sm text-background/60">
                Built by James Wu
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-background/20 pt-8 md:flex-row">
            <p className="text-sm text-background/60">
              © 2025 Synapse AI. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="#privacy"
                className="text-sm text-background/80 transition-colors hover:text-background"
              >
                Privacy
              </Link>
              <Link
                href="#terms"
                className="text-sm text-background/80 transition-colors hover:text-background"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
