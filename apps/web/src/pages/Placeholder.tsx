export function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-border bg-card">
      <h2 className="headline-md text-muted-foreground">
        {title} Content Coming Soon
      </h2>
    </div>
  )
}
