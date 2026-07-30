import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendLoginEmail(to: string, code: string, link: string): Promise<void> {
  // Dev convenience: the console is always an inbox, so login never
  // depends on email actually arriving.
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n━━━ login email for ${to} ━━━\n  code: ${code}\n  link: ${link}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
  }

  if (!resend) return

  try {
    await resend.emails.send({
      from: 'Ingrain <noreply@send.algovision.dev>',
      to,
      subject: `${code} is your Ingrain sign-in code`,
      html: `
        <p>Your sign-in code is:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p>
        <p>Or <a href="${link}">click here to sign in</a>.</p>
        <p style="color:#888">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      `,
    })
  } catch (err) {
    // Email is best-effort: the code was still issued (and printed in
    // dev), so a delivery failure must not fail the login request.
    console.error('resend send failed:', err)
  }
}
