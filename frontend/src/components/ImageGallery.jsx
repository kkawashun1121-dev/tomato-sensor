import { useState } from 'react'
import { useImages } from '../hooks/useImages'

export default function ImageGallery() {
  const { images, error, reload } = useImages()
  const [selectedImage, setSelectedImage] = useState(null)

  return (
    <div style={panelStyle}>
      <h2 style={{ marginTop: 0 }}>📷 画像ギャラリー</h2>
      {error && <p style={{ color: 'red' }}>エラー: {error}</p>}

      <ImageUploadForm onUploaded={reload} />

      <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #eee' }} />

      {images.length === 0 ? (
        <p style={{ color: '#999' }}>まだ画像がありません</p>
      ) : (
        <div style={gridStyle}>
          {images.map((img) => (
            <div
              key={img.id}
              style={thumbStyle}
              onClick={() => setSelectedImage(img)}
            >
              <img
                src={`/static/images/${img.filename}`}
                alt={img.description || img.original_name || ''}
                style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
              />
              <div style={thumbCaptionStyle}>
                {img.description || img.original_name || `image ${img.id}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <Lightbox image={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  )
}

function ImageUploadForm({ onUploaded }) {
  const [file, setFile] = useState(null)
  const [plantId, setPlantId] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setMsg('ファイルを選択してください')
      return
    }
    setSubmitting(true)
    setMsg(null)

    const fd = new FormData()
    fd.append('file', file)
    if (plantId) fd.append('plant_id', plantId)
    if (description) fd.append('description', description)

    try {
      const res = await fetch('/api/images', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMsg(`アップロード成功 (id: ${data.id})`)
      setFile(null)
      setDescription('')
      // ファイル input をクリアするため form を reset
      e.target.reset()
      onUploaded()
    } catch (err) {
      setMsg(`エラー: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
        required
        style={{ fontSize: 14 }}
      />
      <input
        type="number"
        placeholder="plant_id (任意)"
        value={plantId}
        onChange={(e) => setPlantId(e.target.value)}
        style={{ ...inputStyle, width: 120 }}
      />
      <input
        type="text"
        placeholder="説明 (任意)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ ...inputStyle, flex: 1, minWidth: 160 }}
      />
      <button type="submit" disabled={submitting} style={primaryBtnStyle}>
        {submitting ? 'アップロード中...' : '+ 画像を追加'}
      </button>
      {msg && (
        <span style={{ fontSize: 13, color: msg.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>
          {msg}
        </span>
      )}
    </form>
  )
}

function Lightbox({ image, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        cursor: 'pointer',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
        <img
          src={`/static/images/${image.filename}`}
          alt={image.description || ''}
          style={{ maxWidth: '90vw', maxHeight: '80vh', display: 'block', borderRadius: 4 }}
        />
        <div style={{ color: '#fff', textAlign: 'center', marginTop: 12, fontSize: 14 }}>
          {image.description || image.original_name}
          {image.plant_id && ` ・ Plant #${image.plant_id}`}
          <span style={{ marginLeft: 8, color: '#aaa' }}>
            ({new Date(image.uploaded_at).toLocaleString('ja-JP')})
          </span>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={onClose} style={{ ...primaryBtnStyle, background: '#666' }}>
            閉じる
          </button>
        </div>
      </div>
    </div>
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
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: 12,
}
const thumbStyle = {
  border: '1px solid #eee',
  borderRadius: 4,
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'transform 0.15s',
}
const thumbCaptionStyle = {
  padding: '6px 8px',
  fontSize: 12,
  color: '#555',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  background: '#fafafa',
}