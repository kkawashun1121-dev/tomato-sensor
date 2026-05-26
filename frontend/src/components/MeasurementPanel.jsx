import { useState, useMemo } from 'react'
import { usePlants } from '../hooks/usePlants'
import { useMeasurements } from '../hooks/useMeasurements'
import MeasurementChart from './MeasurementChart'

const SENSOR_COLORS = ['#e74c3c', '#3498db', '#2ecc71']

// readings から各センサーの最新値を取り出す (SummaryCards と同じ考え方)
function latestPerSensor(readings) {
  return [0, 1, 2].map((idx) => {
    const filtered = readings.filter((r) => r.sensor_index === idx)
    if (filtered.length === 0) return null
    return filtered.reduce((a, b) =>
      new Date(a.recorded_at) > new Date(b.recorded_at) ? a : b
    )
  })
}

export default function MeasurementPanel({ readings = [] }) {
  const { plants } = usePlants()
  const [plantId, setPlantId] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)

  const { measurements, reload } = useMeasurements(plantId || null)

  // 今の3本の値とその平均
  const latest = useMemo(() => latestPerSensor(readings), [readings])
  const present = latest.filter((r) => r != null)
  const avgNow =
    present.length > 0
      ? present.reduce((s, r) => s + r.moisture_pct, 0) / present.length
      : null

  const handleRecord = async () => {
    if (!plantId) {
      setMsg('エラー: 先に株を選んでください')
      return
    }
    if (present.length === 0) {
      setMsg('エラー: 今のセンサー値が取得できていません')
      return
    }
    setSubmitting(true)
    setMsg(null)
    try {
      const samples = present.map((r) => ({
        sensor_index: r.sensor_index,
        raw: r.raw,
        moisture_pct: r.moisture_pct,
      }))
      const res = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plant_id: Number(plantId),
          samples,
          note: note || null,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMsg(`記録しました (平均 ${data.avg_pct}% / id: ${data.id})`)
      setNote('')
      reload()
    } catch (err) {
      setMsg(`エラー: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('この測定記録を削除しますか?')) return
    try {
      const res = await fetch(`/api/measurements/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      reload()
    } catch (err) {
      alert(`エラー: ${err.message}`)
    }
  }

  return (
    <div style={panelStyle}>
      <h2 style={{ marginTop: 0 }}>📋 測定の記録 (1株を3本で測って平均)</h2>

      {/* --- 株の選択 --- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#666' }}>測る株:</span>
        <select
          value={plantId}
          onChange={(e) => setPlantId(e.target.value)}
          style={{ ...inputStyle, minWidth: 200 }}
        >
          <option value="">— 株を選択 —</option>
          {plants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.variety}（植: {p.planted_date}）
            </option>
          ))}
        </select>
      </div>

      {/* --- 今のセンサー値 (記録前の確認) --- */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
          今の3本の値（記録前の確認用）
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {[0, 1, 2].map((idx) => {
            const r = latest[idx]
            return (
              <div key={idx} style={{ ...chipStyle, borderColor: SENSOR_COLORS[idx] }}>
                <span style={{ color: SENSOR_COLORS[idx], fontWeight: 'bold' }}>
                  センサー{idx}
                </span>
                {r ? (
                  <span style={{ marginLeft: 8 }}>
                    {r.moisture_pct.toFixed(1)}%{' '}
                    <span style={{ color: '#999', fontSize: 11 }}>(raw {r.raw})</span>
                  </span>
                ) : (
                  <span style={{ marginLeft: 8, color: '#999' }}>データなし</span>
                )}
              </div>
            )
          })}
          <div style={{ fontSize: 15, fontWeight: 'bold', color: '#8e44ad' }}>
            → 平均 {avgNow != null ? avgNow.toFixed(1) : '—'}%
          </div>
        </div>
      </div>

      {/* --- 記録 --- */}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="メモ (任意)"
          style={{ ...inputStyle, width: 220 }}
        />
        <button onClick={handleRecord} disabled={submitting} style={primaryBtnStyle}>
          {submitting ? '記録中...' : 'この株として記録'}
        </button>
        {msg && (
          <span style={{ fontSize: 13, color: msg.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>
            {msg}
          </span>
        )}
      </div>

      {/* --- その株の履歴 --- */}
      {plantId && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, color: '#666' }}>
            この株の測定履歴 ({measurements.length})
          </h3>
          {measurements.length === 0 ? (
            <p style={{ color: '#999' }}>まだ記録がありません</p>
          ) : (
            <>
              <MeasurementChart measurements={measurements} />
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16, fontSize: 13 }}>
                <thead>
                  <tr style={{ color: '#666', textAlign: 'left', borderBottom: '2px solid #eee' }}>
                    <th style={thStyle}>日時</th>
                    <th style={thStyle}>平均</th>
                    <th style={thStyle}>センサー0</th>
                    <th style={thStyle}>センサー1</th>
                    <th style={thStyle}>センサー2</th>
                    <th style={thStyle}>メモ</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tdStyle}>{formatDateTime(m.measured_at)}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold', color: '#8e44ad' }}>
                        {m.avg_pct}%
                      </td>
                      <td style={tdStyle}>{fmtPct(m.pct_0)}</td>
                      <td style={tdStyle}>{fmtPct(m.pct_1)}</td>
                      <td style={tdStyle}>{fmtPct(m.pct_2)}</td>
                      <td style={tdStyle}>{m.note || ''}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleDelete(m.id)}
                          style={{ color: '#e74c3c', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}
                          title="削除"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function fmtPct(v) {
  return v == null ? '—' : `${v.toFixed(1)}%`
}

function formatDateTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// --- styles ---
const panelStyle = {
  background: '#fff',
  padding: 20,
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  marginBottom: 24,
}
const inputStyle = {
  padding: '6px 10px',
  border: '1px solid #ddd',
  borderRadius: 4,
  fontSize: 14,
}
const primaryBtnStyle = {
  padding: '7px 16px',
  background: '#8e44ad',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14,
}
const chipStyle = {
  padding: '6px 12px',
  border: '2px solid #ddd',
  borderRadius: 20,
  fontSize: 13,
  background: '#fafafa',
}
const thStyle = { padding: '6px 8px' }
const tdStyle = { padding: '6px 8px' }
