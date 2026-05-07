import { useState } from 'react'
import { useFruits } from '../hooks/useFruits'
import { usePlants } from '../hooks/usePlants'

export default function FruitManager() {
  const { fruits, error, reload } = useFruits()
  const { plants } = usePlants()

  return (
    <div style={panelStyle}>
      <h2 style={{ marginTop: 0 }}>🌸 実 (Fruit) の管理</h2>
      {error && <p style={{ color: 'red' }}>エラー: {error}</p>}

      <FruitForm plants={plants} onCreated={reload} />

      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 16, color: '#666' }}>登録済みの実 ({fruits.length})</h3>
        {fruits.length === 0 ? (
          <p style={{ color: '#999' }}>
            まだ実がありません。実は「花が咲いた瞬間に1つずつ登録」してから、収穫時に詳細を追記する流れです。
          </p>
        ) : (
          fruits.map((f) => (
            <FruitRow
              key={f.id}
              fruit={f}
              plants={plants}
              onUpdated={reload}
              onDeleted={reload}
            />
          ))
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