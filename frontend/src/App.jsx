import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [readings, setReadings] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/readings?limit=10')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => setReadings(data))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>トマト栽培モニター</h1>
      {error && <p style={{ color: 'red' }}>エラー: {error}</p>}
      <p>取得した件数: {readings.length}</p>
      <pre style={{ background: '#f0f0f0', padding: 10, borderRadius: 4 }}>
        {JSON.stringify(readings.slice(0, 3), null, 2)}
      </pre>
    </div>
  )
}

export default App