// Delivery of login codes. Real email (Resend) lands in M8 — until
// then, the server console is the inbox. This function's signature
// won't change, so callers never need to know the difference.
export async function sendLoginEmail(to: string, code: string, link: string): Promise<void> {
  console.log(`\n━━━ login email for ${to} ━━━\n  code: ${code}\n  link: ${link}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}
