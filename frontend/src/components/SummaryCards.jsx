function timeAgo(date) {
  const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diffSec < 60) return `${diffSec}秒前`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分前`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}時間前`
  return `${Math.floor(diffSec / 86400)}日前`
}

function statusColor(pct, ageMin) {
  // データが古ければグレー
  if (ageMin > 30) return '#999'
  // 水分量で色分け
  if (pct < 30) return '#e74c3c'  // 乾き気味 (赤)
  if (pct < 60) return '#f39c12'  // 適度 (橙)
  return '#27ae60'                // 湿り気味 (緑)
}

export default function SummaryCards({ readings }) {
  // 各センサーの最新値を取り出す
  const latest = [0, 1, 2].map((idx) => {
    const filtered = readings.filter((r) => r.sensor_index === idx)
    if (filtered.length === 0) return { idx, data: null }
    const newest = filtered.reduce((a, b) =>
      new Date(a.recorded_at) > new Date(b.recorded_at) ? a : b
    )
    return { idx, data: newest }
  })

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: 24,
      }}
    >
      {latest.map(({ idx, data }) => {
        const ageMin = data
          ? Math.floor((Date.now() - new Date(data.recorded_at).getTime()) / 60000)
          : null
        const color = data ? statusColor(data.moisture_pct, ageMin) : '#999'

        return (
          <div
            key={idx}
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 8,
              borderTop: `4px solid ${color}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>
              Sensor {idx}
            </div>
            {data ? (
              <>
                <div
                  style={{
                    fontSize: 38,
                    fontWeight: 'bold',
                    color,
                    lineHeight: 1,
                  }}
                >
                  {data.moisture_pct.toFixed(1)}
                  <span style={{ fontSize: 18, marginLeft: 4 }}>%</span>
                </div>
                <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                  raw: {data.raw} ・ {timeAgo(data.recorded_at)}
                </div>
              </>
            ) : (
              <div style={{ color: '#999', fontSize: 14, padding: '20px 0' }}>
                データなし
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}