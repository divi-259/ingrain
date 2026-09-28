export default function MountainIcon({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M2 19 9 8l4 6 2-3 7 8Z" fill="var(--sage)" />
      <path d="M9 8 7 11l2 1.4 2-2.6Z" fill="var(--surface)" />
    </svg>
  )
}
