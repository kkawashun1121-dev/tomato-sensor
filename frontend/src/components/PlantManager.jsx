import { useState } from 'react'
import { usePlants } from '../hooks/usePlants'

export default function PlantManager() {
  const { plants, error, reload } = usePlants()
  const [activePlantId, setActivePlantId] = useState(null)

  return (
    <div style={panelStyle}>
      <h2 style={{ marginTop: 0 }}>🌱 株の管理</h2>
      {error && <p style={{ color: 'red' }}>エラー: {error}</p>}

      <PlantForm onCreated={reload} />

      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 16, color: '#666' }}>登録済みの株 ({plants.length})</h3>
        {plants.length === 0 ? (
          <p style={{ color: '#999' }}>まだ株がありません</p>
        ) : (
          plants.map((p) => (
            <PlantRow
              key={p.id}
              plant={p}
              isActive={activePlantId === p.id}
              onSelect={() =>
                setActivePlantId(activePlantId === p.id ? null : p.id)
              }
            />
          ))
        )}
      </div>
    </div>
  )
}

function PlantForm({ onCreated }) {
  const [variety, setVariety] = useState('')
  const [plantedDate, setPlantedDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMsg(null)
    try {
      const res = await fetch('/api/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variety,
          planted_date: plantedDate,
          note: note || null,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMsg(`登録成功 (id: ${data.id})`)
      setVariety('')
      setNote('')
      onCreated()
    } catch (err) {
      setMsg(`エラー: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <Field label="品種">
        <input
          type="text"
          value={variety}
          onChange={(e) => setVariety(e.target.value)}
          placeholder="例: 桃太郎、ミニトマト"
          required
          style={inputStyle}
        />
      </Field>
      <Field label="植えた日">
        <input
          type="date"
          value={plantedDate}
          onChange={(e) => setPlantedDate(e.target.value)}
          required
          style={inputStyle}
        />
      </Field>
      <Field label="メモ (任意)">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="例: ベランダ栽培"
          style={inputStyle}
        />
      </Field>
      <button type="submit" disabled={submitting} style={primaryBtnStyle}>
        {submitting ? '登録中...' : '+ 株を登録'}
      </button>
      {msg && (
        <span style={{ marginLeft: 12, color: msg.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>
          {msg}
        </span>
      )}
    </form>
  )
}

function PlantRow({ plant, isActive, onSelect }) {
  return (
    <div style={plantRowStyle}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={onSelect}
      >
        <div>
          <strong>{plant.variety}</strong>
          <span style={{ marginLeft: 12, color: '#666', fontSize: 13 }}>
            植: {plant.planted_date}
            {plant.note && ` ・ ${plant.note}`}
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#999' }}>
          {isActive ? '▲ 閉じる' : '▼ 操作'}
        </span>
      </div>

      {isActive && (
        <div style={{ marginTop: 12, padding: 12, background: '#f9f9f9', borderRadius: 4 }}>
          <SubForm
            label="💧 水やりを記録"
            url="/api/waterings"
            buildPayload={(form) => ({
              plant_id: plant.id,
              amount_ml: form.amount_ml ? Number(form.amount_ml) : null,
              note: form.note || null,
            })}
            fields={[
              { name: 'amount_ml', label: '量 (ml)', type: 'number' },
              { name: 'note', label: 'メモ', type: 'text' },
            ]}
          />

          <div style={{ height: 8 }} />

          <SubForm
            label="🍅 収穫を記録"
            url="/api/harvests"
            buildPayload={(form) => ({
              plant_id: plant.id,
              harvested_on: form.harvested_on,
              count: Number(form.count),
              brix: form.brix ? Number(form.brix) : null,
              note: form.note || null,
            })}
            fields={[
              {
                name: 'harvested_on',
                label: '収穫日',
                type: 'date',
                defaultValue: new Date().toISOString().slice(0, 10),
                required: true,
              },
              {
                name: 'count',
                label: '個数',
                type: 'number',
                defaultValue: 1,
                required: true,
              },
              { name: 'brix', label: '糖度', type: 'number', step: '0.1' },
              { name: 'note', label: 'メモ', type: 'text' },
            ]}
          />
        </div>
      )}
    </div>
  )
}

function SubForm({ label, url, buildPayload, fields }) {
  const [values, setValues] = useState(
    Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? '']))
  )
  const [msg, setMsg] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const onChange = (name, value) =>
    setValues((prev) => ({ ...prev, [name]: value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMsg(null)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(values)),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMsg(`OK (id: ${data.id})`)
      setValues(
        Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? '']))
      )
    } catch (err) {
      setMsg(`エラー: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
      <span style={{ fontWeight: 'bold', fontSize: 13, marginRight: 8 }}>{label}</span>
      {fields.map((f) => (
        <input
          key={f.name}
          type={f.type}
          step={f.step}
          required={f.required}
          placeholder={f.label}
          value={values[f.name]}
          onChange={(e) => onChange(f.name, e.target.value)}
          style={{ ...inputStyle, width: f.type === 'date' ? 130 : 100, padding: '4px 8px', fontSize: 13 }}
          title={f.label}
        />
      ))}
      <button type="submit" disabled={submitting} style={smallBtnStyle}>
        {submitting ? '...' : '送信'}
      </button>
      {msg && (
        <span style={{ marginLeft: 6, fontSize: 12, color: msg.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>
          {msg}
        </span>
      )}
    </form>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'inline-flex', flexDirection: 'column', marginRight: 12 }}>
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
const plantRowStyle = {
  padding: 12,
  border: '1px solid #eee',
  borderRadius: 4,
  marginBottom: 8,
}