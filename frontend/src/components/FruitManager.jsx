import { useState, useEffect } from 'react'
import { useFruits } from '../hooks/useFruits'
import { usePlants } from '../hooks/usePlants'

// プランター(株)別にグループ化する。株は登録順(id昇順)、実も登録順(id昇順)。
function groupByPlant(fruits, plants) {
  const groups = new Map()
  for (const f of [...fruits].sort((a, b) => a.id - b.id)) {
    const key = f.plant_id ?? 'none'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(f)
  }
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    if (a === 'none') return 1
    if (b === 'none') return -1
    return a - b
  })
  return sortedKeys.map((key) => ({
    plant: plants.find((p) => p.id === key) || null,
    items: groups.get(key),
  }))
}

export default function FruitManager() {
  const { fruits, error, reload } = useFruits()
  const { plants } = usePlants()
  const [sortMode, setSortMode] = useState('new')

  const renderRow = (f) => (
    <FruitRow
      key={f.id}
      fruit={f}
      plants={plants}
      onUpdated={reload}
      onDeleted={reload}
    />
  )

  return (
    <div style={panelStyle}>
      <h2 style={{ marginTop: 0 }}>🌸 実 (Fruit) の管理</h2>
      {error && <p style={{ color: 'red' }}>エラー: {error}</p>}

      <FruitForm plants={plants} onCreated={reload} />

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ fontSize: 16, color: '#666', margin: 0 }}>登録済みの実 ({fruits.length})</h3>
          <label style={{ fontSize: 13, color: '#666' }}>
            並び替え:{' '}
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} style={inputStyle}>
              <option value="new">登録順（新しい順）</option>
              <option value="old">登録順（古い順）</option>
              <option value="plant">プランター（株）別</option>
            </select>
          </label>
        </div>

        {fruits.length === 0 ? (
          <p style={{ color: '#999', marginTop: 12 }}>
            まだ実がありません。実は「花が咲いた瞬間に1つずつ登録」してから、収穫時に詳細を追記する流れです。
          </p>
        ) : sortMode === 'plant' ? (
          groupByPlant(fruits, plants).map(({ plant, items }) => (
            <div key={plant ? plant.id : 'none'} style={{ marginTop: 16 }}>
              <div style={plantHeaderStyle}>
                🪴 {plant ? `#${plant.id} ${plant.variety}` : 'プランター未設定'}
                <span style={{ color: '#999', fontWeight: 'normal', marginLeft: 8, fontSize: 12 }}>
                  ({items.length})
                </span>
              </div>
              {items.map(renderRow)}
            </div>
          ))
        ) : (
          [...fruits]
            .sort((a, b) => (sortMode === 'old' ? a.id - b.id : b.id - a.id))
            .map(renderRow)
        )}
      </div>
    </div>
  )
}

function FruitForm({ plants, onCreated }) {
  const [plantId, setPlantId] = useState('')
  const [floweringDate, setFloweringDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMsg(null)
    try {
      const res = await fetch('/api/fruits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plant_id: Number(plantId),
          flowering_date: floweringDate || null,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMsg(`登録成功 (id: ${data.id})`)
      onCreated()
    } catch (err) {
      setMsg(`エラー: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <Field label="株 (Plant)">
        <select
          value={plantId}
          onChange={(e) => setPlantId(e.target.value)}
          required
          style={inputStyle}
        >
          <option value="">-- 選択 --</option>
          {plants.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.id} {p.variety}
            </option>
          ))}
        </select>
      </Field>
      <Field label="開花日 (任意)">
        <input
          type="date"
          value={floweringDate}
          onChange={(e) => setFloweringDate(e.target.value)}
          style={inputStyle}
        />
      </Field>
      <button type="submit" disabled={submitting || !plantId} style={primaryBtnStyle}>
        {submitting ? '登録中...' : '+ 実を登録'}
      </button>
      {msg && (
        <span style={{ marginLeft: 12, color: msg.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>
          {msg}
        </span>
      )}
    </form>
  )
}

function FruitRow({ fruit, plants, onUpdated, onDeleted }) {
  const [expanded, setExpanded] = useState(false)
  const plant = plants.find((p) => p.id === fruit.plant_id)

  const handleDelete = async () => {
    if (!window.confirm(`実 #${fruit.id} を削除しますか?`)) return
    try {
      const res = await fetch(`/api/fruits/${fruit.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      onDeleted()
    } catch (err) {
      alert(`エラー: ${err.message}`)
    }
  }

  return (
    <div style={fruitRowStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <strong>実 #{fruit.id}</strong>
          {plant && <span style={{ marginLeft: 8, color: '#666' }}>({plant.variety})</span>}
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
            開花日: {fruit.flowering_date || '未設定'}
            {fruit.harvested_on && ` ・ 収穫日: ${fruit.harvested_on}`}
            {fruit.brix != null && ` ・ 糖度: ${fruit.brix}`}
            {fruit.fruit_height_cm != null && ` ・ 実の高さ: ${fruit.fruit_height_cm}cm`}
            {fruit.fruit_diameter_cm != null && ` ・ 直径: ${fruit.fruit_diameter_cm}cm`} 
            {fruit.fruit_weight_g != null && ` ・ 重さ: ${fruit.fruit_weight_g}g`} 
            {fruit.final_plant_height_cm != null && ` ・ 株の身長: ${fruit.final_plant_height_cm}cm`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={smallBtnStyle}
          >
            {expanded ? '閉じる' : '詳細を編集'}
          </button>
          <button onClick={handleDelete} style={deleteBtnStyle}>
            削除
          </button>
        </div>
      </div>

      <SunlightDisplay fruit={fruit} />

      <FruitImages fruitId={fruit.id} />

      {expanded && <FruitUpdateForm fruit={fruit} onUpdated={onUpdated} />}
    </div>
  )
}

function SunlightDisplay({ fruit }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchSunlight = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/fruits/${fruit.id}/sunlight-since-flowering`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        background: '#fffbf0',
        borderRadius: 4,
        borderLeft: '3px solid #f39c12',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 13 }}>☀️ 開花からの累積日照時間</strong>
        <button onClick={fetchSunlight} disabled={loading || !fruit.flowering_date} style={smallBtnStyle}>
          {loading ? '計算中...' : '計算する'}
        </button>
      </div>
      {!fruit.flowering_date && (
        <p style={{ fontSize: 12, color: '#999', margin: '8px 0 0' }}>
          開花日が未設定です。先に実を編集して開花日を入れてください。
        </p>
      )}
      {error && <p style={{ color: '#e74c3c', fontSize: 12, margin: '8px 0 0' }}>エラー: {error}</p>}
      {data && (
        <div style={{ marginTop: 8, fontSize: 14 }}>
          <span style={{ fontSize: 24, fontWeight: 'bold', color: '#f39c12' }}>
            {data.total_sunlight_hours.toFixed(1)}
          </span>
          <span style={{ marginLeft: 4, color: '#666' }}>時間</span>
          <span style={{ marginLeft: 12, fontSize: 12, color: '#999' }}>
            ({data.flowering_date} 〜 {data.until} / {data.days} 日間)
          </span>
        </div>
      )}
    </div>
  )
}

function FruitImages({ fruitId }) {
  const [images, setImages] = useState([])
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)

  const reload = () => {
    fetch(`/api/images?fruit_id=${fruitId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setImages)
      .catch((err) => setMsg(`エラー: ${err.message}`))
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fruitId])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setMsg('ファイルを選択してください')
      return
    }
    setSubmitting(true)
    setMsg(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('fruit_id', fruitId)
    try {
      const res = await fetch('/api/images', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setFile(null)
      e.target.reset()
      reload()
    } catch (err) {
      setMsg(`エラー: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('この写真を削除しますか?')) return
    try {
      const res = await fetch(`/api/images/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      reload()
    } catch (err) {
      alert(`エラー: ${err.message}`)
    }
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        background: '#f7faff',
        borderRadius: 4,
        borderLeft: '3px solid #3498db',
      }}
    >
      <strong style={{ fontSize: 13 }}>📷 この実の写真 ({images.length})</strong>
      <form
        onSubmit={handleUpload}
        style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ fontSize: 13 }}
        />
        <button type="submit" disabled={submitting} style={smallBtnStyle}>
          {submitting ? '追加中...' : '+ 写真を追加'}
        </button>
        {msg && (
          <span style={{ fontSize: 12, color: msg.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>
            {msg}
          </span>
        )}
      </form>
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {images.map((img) => (
            <div key={img.id} style={{ position: 'relative' }}>
              <a href={`/static/images/${img.filename}`} target="_blank" rel="noreferrer">
                <img
                  src={`/static/images/${img.filename}`}
                  alt={img.description || ''}
                  style={{
                    width: 90,
                    height: 90,
                    objectFit: 'cover',
                    borderRadius: 4,
                    display: 'block',
                    border: '1px solid #ddd',
                  }}
                />
              </a>
              <button
                onClick={() => handleDelete(img.id)}
                title="削除"
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  background: 'rgba(231,76,60,0.9)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  cursor: 'pointer',
                  fontSize: 12,
                  lineHeight: '18px',
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FruitUpdateForm({ fruit, onUpdated }) {

  const [values, setValues] = useState({
  flowering_date: fruit.flowering_date || '',
  harvested_on: fruit.harvested_on || '',
  fruit_height_cm: fruit.fruit_height_cm ?? '',
  fruit_diameter_cm: fruit.fruit_diameter_cm ?? '',    // ← 追加
  fruit_weight_g: fruit.fruit_weight_g ?? '',          // ← 追加
  final_plant_height_cm: fruit.final_plant_height_cm ?? '',
  brix: fruit.brix ?? '',
  note: fruit.note || '',
})
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)

  const update = (k, v) => setValues((prev) => ({ ...prev, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMsg(null)

    // 空文字を null に変換
    const payload = Object.fromEntries(
      Object.entries(values).map(([k, v]) => {
        if (v === '') return [k, null]
       if (['fruit_height_cm', 'fruit_diameter_cm', 'fruit_weight_g', 'final_plant_height_cm', 'brix'].includes(k)) {
        return [k, Number(v)]
        }
        return [k, v]
      })
    )

    try {
      const res = await fetch(`/api/fruits/${fruit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setMsg('更新成功')
      onUpdated()
    } catch (err) {
      setMsg(`エラー: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: 12,
        padding: 12,
        background: '#f9f9f9',
        borderRadius: 4,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 8,
      }}
    >
      <Field label="開花日">
        <input
          type="date"
          value={values.flowering_date}
          onChange={(e) => update('flowering_date', e.target.value)}
          style={inputStyle}
        />
      </Field>
      <Field label="収穫日">
        <input
          type="date"
          value={values.harvested_on}
          onChange={(e) => update('harvested_on', e.target.value)}
          style={inputStyle}
        />
      </Field>
      <Field label="実の高さ (cm)">
        <input
          type="number"
          step="0.1"
          value={values.fruit_height_cm}
          onChange={(e) => update('fruit_height_cm', e.target.value)}
          style={inputStyle}
        />
      </Field>
      <Field label="実の直径 (cm)">
        <input
            type="number"
            step="0.1"
            value={values.fruit_diameter_cm}
            onChange={(e) => update('fruit_diameter_cm', e.target.value)}
            style={inputStyle}
        />
        </Field>
    <Field label="実の重量 (g)">
        <input
            type="number"
            step="0.1"
            value={values.fruit_weight_g}
            onChange={(e) => update('fruit_weight_g', e.target.value)}
            style={inputStyle}
        />
        </Field>
      <Field label="株の最終身長 (cm)">
        <input
          type="number"
          step="0.1"
          value={values.final_plant_height_cm}
          onChange={(e) => update('final_plant_height_cm', e.target.value)}
          style={inputStyle}
        />
      </Field>
      <Field label="糖度 (Brix)">
        <input
          type="number"
          step="0.1"
          value={values.brix}
          onChange={(e) => update('brix', e.target.value)}
          style={inputStyle}
        />
      </Field>
      <Field label="メモ">
        <input
          type="text"
          value={values.note}
          onChange={(e) => update('note', e.target.value)}
          style={inputStyle}
        />
      </Field>
      <div style={{ gridColumn: '1 / 3', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="submit" disabled={submitting} style={primaryBtnStyle}>
          {submitting ? '更新中...' : '保存'}
        </button>
        {msg && (
          <span style={{ color: msg.startsWith('エラー') ? '#e74c3c' : '#27ae60', fontSize: 13 }}>
            {msg}
          </span>
        )}
      </div>
    </form>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  )
}

// --- styles ---
const panelStyle = {
  background: '#fff',
  padding: 20,
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  marginBottom: 24,
}
const formStyle = {
  display: 'flex',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
  gap: 8,
  paddingBottom: 16,
  borderBottom: '1px solid #eee',
}
const inputStyle = {
  padding: '6px 10px',
  border: '1px solid #ddd',
  borderRadius: 4,
  fontSize: 14,
}
const primaryBtnStyle = {
  padding: '7px 16px',
  background: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14,
}
const smallBtnStyle = {
  padding: '4px 12px',
  background: '#3498db',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
}
const deleteBtnStyle = {
  padding: '4px 10px',
  background: '#e74c3c',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
}
const fruitRowStyle = {
  padding: 12,
  border: '1px solid #eee',
  borderRadius: 4,
  marginBottom: 12,
}
const plantHeaderStyle = {
  fontWeight: 'bold',
  fontSize: 14,
  color: '#27ae60',
  padding: '6px 0',
  borderBottom: '2px solid #eef7f0',
  marginBottom: 8,
}