// Ambient, low-contrast Mountain Journey motifs scattered in the page
// margins. Fixed to the viewport (not the document) so they stay put as
// the page scrolls; hidden below a wide desktop breakpoint since there's
// no gutter to hold them once the content column fills the view. Shared
// by any page that opts into the wider, more spacious layout.
export default function PageBackdrop() {
  return (
    <div className="page-bg" aria-hidden="true">
      <svg className="bg-shape bg-mountain" width="220" height="140" viewBox="0 0 220 140" fill="none">
        <path d="M0 140 40 70 70 100 110 40 150 100 180 60 220 140Z" fill="var(--sage)" />
      </svg>
      <svg className="bg-shape bg-cloud" width="120" height="60" viewBox="0 0 120 60" fill="none">
        <ellipse cx="40" cy="35" rx="28" ry="18" fill="var(--soft-teal)" />
        <ellipse cx="70" cy="28" rx="22" ry="16" fill="var(--soft-teal)" />
        <ellipse cx="95" cy="38" rx="18" ry="14" fill="var(--soft-teal)" />
      </svg>
      <svg className="bg-shape bg-leaves" width="56" height="56" viewBox="0 0 24 24" fill="none">
        <path d="M20 4C10 4 4 10 4 18v2h2c8 0 14-6 14-16Z" fill="var(--sage)" />
      </svg>
      <svg className="bg-shape bg-trail" width="140" height="100" viewBox="0 0 140 100" fill="none">
        <circle cx="10" cy="90" r="4" fill="var(--apricot)" />
        <circle cx="35" cy="70" r="4" fill="var(--apricot)" />
        <circle cx="55" cy="45" r="4" fill="var(--apricot)" />
        <circle cx="80" cy="30" r="4" fill="var(--apricot)" />
        <circle cx="110" cy="15" r="4" fill="var(--apricot)" />
      </svg>
    </div>
  )
}
