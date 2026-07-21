import { useEffect, useState } from 'react'

export default function App() {
  const [serverStatus, setServerStatus] = useState('checking...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setServerStatus(data.ok ? 'connected' : 'unexpected response'))
      .catch(() => setServerStatus('unreachable'))
  }, [])

  return (
    <main>
      <h1>Ingrain</h1>
      <p>Server: {serverStatus}</p>
    </main>
  )
}
