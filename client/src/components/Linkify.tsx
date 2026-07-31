// Renders plain text with any URLs turned into clickable links.
// Matches http(s):// and www.-prefixed URLs; trailing punctuation
// ("…see https://foo.dev.") stays outside the link.
const URL_RE = /(https?:\/\/\S+|www\.\S+)/g

export default function Linkify({ text }: { text: string }) {
  // One capture group in the regex → split() alternates text / URL parts
  return (
    <>
      {text.split(URL_RE).map((part, i) => {
        if (i % 2 === 0) return part
        const trailing = part.match(/[.,;:!?'")\]]+$/)?.[0] ?? ''
        const url = trailing ? part.slice(0, -trailing.length) : part
        return (
          <span key={i}>
            <a
              href={url.toLowerCase().startsWith('www.') ? `https://${url}` : url}
              target="_blank"
              rel="noreferrer"
            >
              {url}
            </a>
            {trailing}
          </span>
        )
      })}
    </>
  )
}
