import { useState } from 'react'
import { useReadings } from './hooks/useReadings'
import MoistureChart from './components/MoistureChart'
import SummaryCards from './components/SummaryCards'  // ← 追加
import './App.css'

const PERIODS = [
  { label: '24h', hours: 24 },
  { label: '7d', hours: 24 * 7 },
  { label: '30d', hours: 24 * 30 },
]

function App() {
  const [hours, setHours] = useState(24)
  const { readings, error, loading } = useReadings(hours)

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 1100, margin: '0 auto' }}>
      <h1>🍅 トマト栽培モニター</h1>

      {/* サマリーカードを追加 */}
      <SummaryCards readings={readings} />

      <div style={{ marginBottom: 16 }}>
        {PERIODS.map((p) => (
          <button
            key={p.hours}
            onClick={() => setHours(p.hours)}
            style={{
              marginRight: 8,
              padding: '6px 16px',
              background: hours === p.hours ? '#e74c3c' : '#eee',
              color: hours === p.hours ? '#fff' : '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && <p style={{ color: 'red' }}>エラー: {error}</p>}
      {loading && readings.length === 0 && <p>読み込み中...</p>}

      <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <p style={{ color: '#666', margin: '0 0 12px' }}>
          取得件数: {readings.length}
        </p>
        {readings.length > 0 ? (
          <MoistureChart readings={readings} />
        ) : (
          <p>この期間のデータがありません</p>
        )}
      </div>

      <footer style={{ marginTop: 30, textAlign: 'center', color: '#666', fontSize: 13 }}>
        18124058 河村隼介 / 前期取り組み — ESP32 + 静電容量式センサー × 3
      </footer>
    </div>
  )
}

export default App