import happy from '../assets/mascot/happy.webp'
import excited from '../assets/mascot/excited.webp'
import motivated from '../assets/mascot/motivated.webp'
import letsgo from '../assets/mascot/letsgo.webp'
import calm from '../assets/mascot/calm.webp'
import thinking from '../assets/mascot/thinking.webp'
import confused from '../assets/mascot/confused.webp'
import curious from '../assets/mascot/curious.webp'

const SPRITES = { happy, excited, motivated, letsgo, calm, thinking, confused, curious }

export type MascotExpression = keyof typeof SPRITES

// A small, contextual companion — never the focal point. Cropped from the
// same mascot sheet as the Today hero illustration, so it's always
// recognizably the same cat, just a different expression per moment:
// Happy/Excited for completions and streaks, Motivated/Let's go for
// calls to action, Calm for quiet/empty states, Thinking/Confused/Curious
// for learning or missing-content moments.
export default function Mascot({
  expression,
  size = 48,
  className,
}: {
  expression: MascotExpression
  size?: number
  className?: string
}) {
  return (
    <img
      src={SPRITES[expression]}
      alt=""
      draggable={false}
      className={className ? `mascot ${className}` : 'mascot'}
      style={{ width: size, height: 'auto' }}
    />
  )
}
