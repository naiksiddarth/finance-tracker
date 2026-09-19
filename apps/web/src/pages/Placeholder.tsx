export function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg bg-card">
      <h2 className="headline-md text-muted-foreground">{title} Content Coming Soon</h2>
    </div>
  )
}
