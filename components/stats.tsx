const stats = [
  {
    value: "36M+",
    label: "PubMed citations",
    sublabel: "Searchable biomedical literature",
  },
  {
    value: "< 30s",
    label: "Average query time",
    sublabel: "Search, embed, and synthesize",
  },
]

export function Stats() {
  return (
    <section className="border-y border-border/40 bg-frost/50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold tracking-tight md:text-4xl">
                {stat.value}
              </div>
              <div className="text-sm font-medium mt-1">
                {stat.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {stat.sublabel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
