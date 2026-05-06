import { useEnvironments } from '../hooks/useEnvironments'

function timeAgo(date) {
  const diffMin = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (diffMin < 1) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}時間前`
  return `${Math.floor(diffMin / 1440)}日前`
}

export default function EnvironmentPanel() {
  const { environments, error } = useEnvironments(30)

  const latest = environments[0]

  return (
    <div
      style={{
        background: '#fff',
        padding: 20,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: 24,
      }}
    >
      <h2 style={{ marginTop: 0 }}>🌤 環境データ</h2>

      {error && <p style={{ color: 'red' }}>エラー: {error}</p>}

      {latest ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Stat label="天気" value={latest.weather ?? '-'} />
            <Stat
              label="気温"
              value={latest.temperature_c != null ? `${latest.temperature_c}℃` : '-'}
            />
            <Stat
              label="湿度"
              value={latest.humidity_pct != null ? `${latest.humidity_pct}%` : '-'}
            />
            <Stat
              label="日照"
              value={
                latest.sunlight_hours != null
                  ? `${latest.sunlight_hours.toFixed(2)}h`
                  : '-'
              }
            />
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
            最終更新: {timeAgo(latest.recorded_at)} ({environments.length}件 / 30件まで表示)
          </div>
        </>
      ) : (
        <p style={{ color: '#999' }}>まだ環境データがありません。`scripts/fetch_weather.py` を実行してください。</p>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center', padding: 8 }}>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 'bold', color: '#333' }}>{value}</div>
    </div>
  )
}