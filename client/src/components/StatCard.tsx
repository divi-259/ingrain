type Tone = 'apricot' | 'teal' | 'sage'

export default function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: string
  value: string | number
  label: string
  tone: Tone
}) {
  return (
    <div className="stat">
      <span className={`stat-icon stat-icon-${tone}`} aria-hidden="true">{icon}</span>
      <span className="stat-value">{value}</span>
      <span className="muted">{label}</span>
    </div>
  )
}
