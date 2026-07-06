/**
 * PlantDiagramEditor.jsx
 * 植物図エディタ — Reactコンポーネント（DB永続化 + 実ID管理対応）
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { createEngine } from './PlantDiagramEngine'

const API = '/api/plant-diagrams'
const FRUITS_API = '/api/fruits'
const PLANTS_API = '/api/plants'

// ── スタイル定数 ──────────────────────────────────────────────────────────────
const pde = {
  panel: { background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 24, overflow: 'hidden' },
  header: { background: 'linear-gradient(to bottom, #2a5a2a, #1a3a1a)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 },
  headerTitle: { margin: 0, color: '#a8e6a8', fontSize: 16, fontWeight: 700 },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  headerStat:  { marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#a8e6a8', background: 'rgba(0,0,0,0.3)', padding: '3px 12px', borderRadius: 20 },
  saveBadge: (saving) => ({
    fontSize: 11, color: saving ? '#ffe066' : 'rgba(255,255,255,0.35)',
    marginLeft: 8, transition: 'color 0.3s',
  }),
  body: { display: 'flex', height: 480 },
  sidebar: { width: 196, minWidth: 180, background: '#192a19', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', overflowX: 'hidden', fontFamily: 'inherit' },
  section: { padding: '10px 10px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 },
  sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8 },
  ctrlGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 },
  ctrlBtn: (active, danger) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 4, padding: '8px 4px',
    border: `1.5px solid ${active ? (danger ? '#ff8080' : '#a8e6a8') : 'rgba(255,255,255,0.12)'}`,
    borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600, lineHeight: 1.2,
    color: active ? (danger ? '#ff9090' : '#a8e6a8') : 'rgba(255,255,255,0.6)',
    background: active ? (danger ? 'rgba(255,100,100,0.12)' : 'rgba(168,230,168,0.15)') : 'rgba(255,255,255,0.05)',
    transition: 'all 0.12s', userSelect: 'none',
  }),
  actionRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  actionBtn: { padding: '7px 4px', borderRadius: 7, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 11, fontWeight: 600, textAlign: 'center', transition: 'all 0.12s' },
  planterItem: (active) => ({ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 8px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, border: `1.5px solid ${active ? 'rgba(255,255,255,0.18)' : 'transparent'}`, background: active ? 'rgba(255,255,255,0.11)' : 'transparent', transition: 'background 0.12s' }),
  planterDot: (color) => ({ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: color, border: '1.5px solid rgba(255,255,255,0.25)' }),
  planterInfo: { flex: 1, minWidth: 0 },
  planterName: { fontSize: 12, fontWeight: 600, color: '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  planterSub:  { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 },
  planterDel:  { width: 18, height: 18, borderRadius: 4, border: 'none', background: 'transparent', color: 'rgba(255,80,80,0.45)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  plantTypeItem: { display: 'flex', alignItems: 'center', gap: 7, padding: '5px 6px', borderRadius: 6, fontSize: 12, color: '#bbb', marginBottom: 3 },
  plantSwatch: (color) => ({ width: 13, height: 13, borderRadius: 3, flexShrink: 0, background: color }),
  plantTypeDel: { marginLeft: 'auto', width: 16, height: 16, borderRadius: 3, border: 'none', background: 'transparent', color: 'rgba(255,100,100,0.4)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  addBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: '100%', padding: '6px 0', borderRadius: 7, border: '1.5px dashed rgba(255,255,255,0.18)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer', marginTop: 6 },
  canvasWrap: { flex: 1, position: 'relative', overflow: 'hidden', background: '#c8efc8' },
  canvasEl:   { display: 'block', width: '100%', height: '100%' },
  hintBar:    { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '4px 8px', fontSize: 11, pointerEvents: 'none' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 },
  modal:   { background: '#1e3a1e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '22px 26px', width: 320, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' },
  modalTitle:  { fontSize: 14, color: '#a8e6a8', marginBottom: 16, fontWeight: 700, marginTop: 0 },
  modalField:  { marginBottom: 13 },
  modalLabel:  { display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' },
  modalInput:  { width: '100%', padding: '8px 11px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.17)', background: 'rgba(255,255,255,0.08)', color: '#eee', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  modalSelect: { width: '100%', padding: '8px 11px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.17)', background: 'rgba(0,30,0,0.8)', color: '#eee', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  colorRow:    { display: 'flex', alignItems: 'center', gap: 10 },
  colorInput:  { width: 44, height: 34, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'none', cursor: 'pointer', padding: 2 },
  colorPrev:   (c) => ({ flex: 1, height: 34, borderRadius: 6, border: '1px solid rgba(255,255,255,0.13)', background: c }),
  modalBtns:   { display: 'flex', gap: 8, marginTop: 18 },
  modalBtnOk:  { flex: 1, padding: '8px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: '#3a9a3a', color: 'white' },
  modalBtnCa:  { flex: 1, padding: '8px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.6)' },
  errText: { color: '#e74c3c', fontSize: 12, marginTop: 4 },
  plantIdBadge: { fontSize: 10, color: 'rgba(168,230,168,0.6)', marginLeft: 4 },
}

const MODE_HINTS = {
  'stem-add':  '茎モード(追加): ノードからドラッグして茎を伸ばす',
  'stem-del':  '茎モード(削除): ノードをクリックで枝ごと削除　|　茎の線をクリックで線のみ削除',
  'fruit-add': '実モード(追加): ノードをクリックして実を1個追加（株と紐づいている場合は自動でID登録）',
  'fruit-del': '実モード(削除): 実をクリックして1個削除　|　ノードをクリックで1個削除',
  'fruit-name': '実モード(名前): 実をクリックして名前を設定・変更',
  'fruit-move': '実モード(移動): 実をドラッグして好きな位置に移動',
}

export default function PlantDiagramEditor() {
  const canvasRef  = useRef(null)
  const engineRef  = useRef(null)
  const saveTimers = useRef({})
  const fruitEventHandlerRef = useRef(null)  // 最新のハンドラを常に参照

  const [engState, setEngState] = useState({ plants: {}, planters: [], activePlanterId: null, mode: 'stem-add' })
  const [hint, setHint]         = useState(MODE_HINTS['stem-add'])
  const [saving, setSaving]     = useState(false)
  const [loadErr, setLoadErr]   = useState(null)
  const [plantList, setPlantList] = useState([])  // /api/plants の一覧
  const [fruitEdit, setFruitEdit] = useState(null)  // 実の名前インライン編集 { planterId, nodeId, fruitIndex, x, y, value }

  // モーダル
  const [modal, setModal]               = useState(null)
  const [planterName, setPlanterName]   = useState('')
  const [planterPlant, setPlanterPlant] = useState('tomato')
  const [planterPlantId, setPlanterPlantId] = useState('')  // 紐づける株ID
  const [newPlantName, setNewPlantName]   = useState('')
  const [newPlantColor, setNewPlantColor] = useState('#e74c3c')
  const [modalErr, setModalErr]           = useState('')

  // ── オートセーブ（デバウンス 1秒）─────────────────────────────────────────
  const scheduleSave = useCallback((planter) => {
    if (!planter.dbId) return
    clearTimeout(saveTimers.current[planter.id])
    saveTimers.current[planter.id] = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch(`${API}/${planter.dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: planter.name,
            plant_type_key: planter.plantType,
            plant_id: planter.plantId || null,
            diagram_json: planter.diagramJson,
          }),
        })
      } catch (e) { console.error('PlantDiagram save error', e) }
      finally { setSaving(false) }
    }, 1000)
  }, [])

  // ── 実のイベントハンドラ（refを経由して常に最新版を呼ぶ）───────────────────
  fruitEventHandlerRef.current = useCallback(async (event) => {
    if (event.type === 'add') {
      if (!event.plantId) return  // 株未設定のプランターは実IDを管理しない
      try {
        const res = await fetch(FRUITS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plant_id: event.plantId }),
        })
        if (res.ok) {
          const data = await res.json()
          engineRef.current?.setFruitId(event.planterId, event.nodeId, event.fruitIndex, data.id)
          // fruitIds が更新されたので diagram_json を再保存
          const state = engineRef.current?.getState()
          const planter = state?.planters.find(p => p.id === event.planterId)
          if (planter) scheduleSave(planter)
        }
      } catch (e) { console.error('Fruit create error', e) }
    } else if (event.type === 'del') {
      if (event.fruitId != null) {
        try { await fetch(`${FRUITS_API}/${event.fruitId}`, { method: 'DELETE' }) }
        catch (e) { console.error('Fruit delete error', e) }
      }
    } else if (event.type === 'editName') {
      setFruitEdit({
        planterId: event.planterId,
        nodeId: event.nodeId,
        fruitIndex: event.fruitIndex,
        x: event.x, y: event.y,
        value: event.label || '',
      })
    }
  }, [scheduleSave])

  // ── エンジン起動 & DB読み込み ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = createEngine(
      canvas,
      (state) => {
        setEngState(state)
        const active = state.planters.find(p => p.id === state.activePlanterId)
        if (active) scheduleSave(active)
      },
      (event) => fruitEventHandlerRef.current?.(event)
    )
    engineRef.current = engine

    ;(async () => {
      try {
        const [diagramsRes, typesRes, plantsRes] = await Promise.all([
          fetch(API),
          fetch(`${API}/types`),
          fetch(PLANTS_API),
        ])
        if (!diagramsRes.ok || !typesRes.ok) throw new Error('API error')
        const diagrams = await diagramsRes.json()
        const types    = await typesRes.json()
        const plants   = plantsRes.ok ? await plantsRes.json() : []
        setPlantList(plants)

        if (diagrams.length > 0) {
          engine.replaceAllFromDB(diagrams, types)
        } else {
          const state = engine.getState()
          const first = state.planters[0]
          if (first) {
            const res = await fetch(API, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: first.name,
                plant_type_key: first.plantType,
                plant_id: null,
                diagram_json: first.diagramJson,
              }),
            })
            if (res.ok) {
              const data = await res.json()
              engine.setDbId(first.id, data.id)
            }
          }
          for (const t of types) engine.addPlantType(t.key, t.name, t.color)
        }
      } catch (e) {
        console.error('PlantDiagram load error', e)
        setLoadErr('データの読み込みに失敗しました。バックエンドが起動しているか確認してください。')
      }
    })()

    return () => {
      Object.values(saveTimers.current).forEach(clearTimeout)
      engine.destroy()
    }
  }, [scheduleSave])

  // ── モード切替 ─────────────────────────────────────────────────────────────
  function handleSetMode(m) {
    engineRef.current?.setMode(m)
    setEngState(prev => ({ ...prev, mode: m }))
    setHint(MODE_HINTS[m])
  }

  // ── モーダルを開く ─────────────────────────────────────────────────────────
  function openModal(type) {
    setModalErr('')
    if (type === 'planter') {
      setPlanterName(`プランター ${engState.planters.length + 1}`)
      setPlanterPlant(Object.keys(engState.plants)[0] || 'tomato')
      setPlanterPlantId('')
    } else {
      setNewPlantName(''); setNewPlantColor('#e74c3c')
    }
    setModal(type)
  }

  // ── プランターを追加（POST → エンジンに追加） ──────────────────────────────
  async function confirmAddPlanter() {
    if (!planterName.trim()) return
    setModalErr('')
    try {
      const initJson = JSON.stringify({ nodes: [], edges: [] })
      const pid = planterPlantId ? parseInt(planterPlantId) : null
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planterName.trim(),
          plant_type_key: planterPlant,
          plant_id: pid,
          diagram_json: initJson,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      engineRef.current?.createPlanter(planterName.trim(), planterPlant, data.id, null, null, data.plant_id)
      setModal(null)
    } catch (e) {
      setModalErr(`エラー: ${e.message}`)
    }
  }

  // ── カスタム植物を追加 ─────────────────────────────────────────────────────
  async function confirmAddPlant() {
    if (!newPlantName.trim()) return
    setModalErr('')
    const key = 'custom_' + Date.now()
    try {
      const res = await fetch(`${API}/types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, name: newPlantName.trim(), color: newPlantColor }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      engineRef.current?.addPlantType(key, newPlantName.trim(), newPlantColor)
      setModal(null)
    } catch (e) {
      setModalErr(`エラー: ${e.message}`)
    }
  }

  // ── 既存の実を紐づける ────────────────────────────────────────────────────
  async function handleLinkExistingFruits(planter) {
    const eng = engineRef.current
    if (!eng || !planter.plantId) return
    const unlinked = eng.getUnlinkedCount(planter.id)
    if (unlinked === 0) { alert('未紐づけの実がありません。'); return }
    try {
      const res = await fetch(`${FRUITS_API}?plant_id=${planter.plantId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const fruits = await res.json()
      if (fruits.length === 0) { alert('この株にはまだFruitレコードがありません。'); return }
      // IDのみ抽出してエンジンに渡す
      const ids = fruits.map(f => f.id)
      const { assigned, skipped } = eng.assignExistingFruitIds(planter.id, ids)
      // 保存
      const state = eng.getState()
      const updated = state.planters.find(p => p.id === planter.id)
      if (updated) scheduleSave(updated)
      const msg = `${assigned}個の実を紐づけました。` + (skipped > 0 ? `\n（${skipped}個はスロットが足りず未割当）` : '')
      alert(msg)
    } catch (e) {
      alert(`エラー: ${e.message}`)
    }
  }

  // ── 実の名前インライン編集を確定/キャンセル ───────────────────────────────
  function commitFruitEdit() {
    if (!fruitEdit) return
    engineRef.current?.setFruitLabel(fruitEdit.planterId, fruitEdit.nodeId, fruitEdit.fruitIndex, fruitEdit.value)
    setFruitEdit(null)
  }
  function cancelFruitEdit() {
    setFruitEdit(null)
  }

  // ── プランターを削除 ───────────────────────────────────────────────────────
  async function handleDeletePlanter(planter, e) {
    e.stopPropagation()
    if (engState.planters.length <= 1) return
    if (!window.confirm(`「${planter.name}」を削除しますか？`)) return
    if (planter.dbId) {
      try { await fetch(`${API}/${planter.dbId}`, { method: 'DELETE' }) }
      catch (err) { console.error(err) }
    }
    clearTimeout(saveTimers.current[planter.id])
    engineRef.current?.deletePlanter(planter.id)
  }

  // ── カスタム植物を削除 ─────────────────────────────────────────────────────
  async function handleDeletePlantType(key) {
    const eng = engineRef.current
    if (!eng) return
    if (eng.isPlantTypeInUse(key)) { alert('このプランターで使用中の植物は削除できません。'); return }
    try { await fetch(`${API}/types/${key}`, { method: 'DELETE' }) }
    catch (err) { console.error(err) }
    eng.deletePlantType(key)
  }

  // ── キーボードショートカット ───────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (!modal) return
      if (e.key === 'Escape') setModal(null)
      if (e.key === 'Enter' && modal === 'planter') confirmAddPlanter()
      if (e.key === 'Enter' && modal === 'plant')   confirmAddPlant()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const { plants, planters, activePlanterId, mode } = engState
  const activePl = planters.find(p => p.id === activePlanterId)

  // 現在のプランターに紐づく株名を表示
  const activeLinkedPlant = activePl?.plantId
    ? plantList.find(pl => pl.id === activePl.plantId)
    : null

  return (
    <div style={pde.panel}>
      {/* ── ヘッダー ─────────────────────────────── */}
      <div style={pde.header}>
        <h2 style={pde.headerTitle}>🌿 植物図エディタ</h2>
        <span style={pde.headerSub}>
          {activePl?.name || '—'}
          {activeLinkedPlant && (
            <span style={pde.plantIdBadge}>（{activeLinkedPlant.variety} #ID{activeLinkedPlant.id}）</span>
          )}
        </span>
        <span style={pde.saveBadge(saving)}>{saving ? '保存中…' : '自動保存'}</span>
        <span style={pde.headerStat}>実の合計: {activePl?.fruitCount ?? 0}</span>
      </div>

      {loadErr && (
        <div style={{ padding: '10px 16px', background: '#fff3f3', color: '#e74c3c', fontSize: 13 }}>
          ⚠ {loadErr}
        </div>
      )}

      {/* ── ボディ ───────────────────────────────── */}
      <div style={pde.body}>

        {/* ── サイドバー ─────────────────────────── */}
        <div style={pde.sidebar}>

          {/* 植物管理コントロール */}
          <div style={pde.section}>
            <div style={pde.sectionLabel}>植物管理</div>
            <div style={pde.ctrlGrid}>
              {[
                { m: 'stem-add',  icon: '🌿', label: '茎を追加', danger: false },
                { m: 'stem-del',  icon: '✂️', label: '茎を削除', danger: true  },
                { m: 'fruit-add', icon: '＋',  label: '実を追加', danger: false },
                { m: 'fruit-del', icon: '－',  label: '実を削除', danger: true  },
              ].map(({ m, icon, label, danger }) => (
                <button key={m} style={pde.ctrlBtn(mode === m, danger)} onClick={() => handleSetMode(m)}>
                  <span style={{ fontSize: 16 }}>{icon}</span>{label}
                </button>
              ))}
              <button
                key="fruit-name"
                style={pde.ctrlBtn(mode === 'fruit-name', false)}
                onClick={() => handleSetMode('fruit-name')}>
                <span style={{ fontSize: 16 }}>✏️</span>実の名前
              </button>
              <button
                key="fruit-move"
                style={pde.ctrlBtn(mode === 'fruit-move', false)}
                onClick={() => handleSetMode('fruit-move')}>
                <span style={{ fontSize: 16 }}>↔️</span>実を移動
              </button>
            </div>
            <div style={pde.actionRow}>
              <button style={pde.actionBtn} onClick={() => engineRef.current?.undo()}>↩ 元に戻す</button>
              <button style={pde.actionBtn} onClick={() => engineRef.current?.clearPlanter()}>🔄 リセット</button>
            </div>
          </div>

          {/* プランターリスト */}
          <div style={{ ...pde.section, flex: 1 }}>
            <div style={pde.sectionLabel}>プランター</div>
            {planters.map(p => {
              const cfg = plants[p.plantType] || { color: '#888', name: p.plantType }
              const linked = p.plantId ? plantList.find(pl => pl.id === p.plantId) : null
              return (
                <div key={p.id} style={pde.planterItem(p.id === activePlanterId)}
                  onClick={() => engineRef.current?.selectPlanter(p.id)}>
                  <div style={pde.planterDot(cfg.color)} />
                  <div style={pde.planterInfo}>
                    <div style={pde.planterName}>{p.name}</div>
                    <div style={pde.planterSub}>
                      {cfg.name} · 実 {p.fruitCount}個
                      {linked && <span style={{ color: 'rgba(168,230,168,0.55)' }}> · #{linked.id}</span>}
                    </div>
                  </div>
                  {p.plantId && (
                    <button
                      style={{ ...pde.planterDel, color: 'rgba(168,230,168,0.5)', fontSize: 11 }}
                      title="既存の実を紐づける"
                      onClick={e => { e.stopPropagation(); handleLinkExistingFruits(p) }}>
                      🔗
                    </button>
                  )}
                  <button style={pde.planterDel} title="削除"
                    onClick={e => handleDeletePlanter(p, e)}>×</button>
                </div>
              )
            })}
            <button style={pde.addBtn} onClick={() => openModal('planter')}>＋ プランターを追加</button>
          </div>

          {/* 植物の種類リスト */}
          <div style={pde.section}>
            <div style={pde.sectionLabel}>植物の種類</div>
            {Object.entries(plants).map(([key, cfg]) => (
              <div key={key} style={pde.plantTypeItem}>
                <div style={pde.plantSwatch(cfg.color)} />
                <span>{cfg.name}</span>
                {!engineRef.current?.isBuiltin(key) && (
                  <button style={pde.plantTypeDel}
                    onClick={() => handleDeletePlantType(key)} title="削除">×</button>
                )}
              </div>
            ))}
            <button style={pde.addBtn} onClick={() => openModal('plant')}>＋ 植物を追加</button>
          </div>

        </div>

        {/* ── キャンバス ──────────────────────────── */}
        <div style={pde.canvasWrap}>
          <canvas ref={canvasRef} style={pde.canvasEl} />
          {fruitEdit && (
            <input
              autoFocus
              type="text"
              value={fruitEdit.value}
              onChange={e => setFruitEdit(prev => ({ ...prev, value: e.target.value }))}
              onBlur={commitFruitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') commitFruitEdit()
                else if (e.key === 'Escape') cancelFruitEdit()
              }}
              style={{
                position: 'absolute',
                left: fruitEdit.x - 40, top: fruitEdit.y + 12,
                width: 80, fontSize: 11, textAlign: 'center',
                padding: '2px 4px', borderRadius: 4,
                border: '1.5px solid #3a9a3a', background: '#fff', color: '#222',
                outline: 'none', zIndex: 10,
              }}
            />
          )}
          <div style={pde.hintBar}>{hint}</div>
        </div>

      </div>

      {/* ── モーダル ─────────────────────────────── */}
      {modal && (
        <div style={pde.overlay} onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={pde.modal}>
            {modal === 'planter' ? (
              <>
                <h3 style={pde.modalTitle}>🪴 プランターを追加</h3>
                <div style={pde.modalField}>
                  <label style={pde.modalLabel}>プランター名</label>
                  <input style={pde.modalInput} type="text" value={planterName}
                    onChange={e => setPlanterName(e.target.value)} placeholder="例: 畑 A" autoFocus />
                </div>
                <div style={pde.modalField}>
                  <label style={pde.modalLabel}>植物の種類</label>
                  <select style={pde.modalSelect} value={planterPlant}
                    onChange={e => setPlanterPlant(e.target.value)}>
                    {Object.entries(plants).map(([k, v]) => (
                      <option key={k} value={k}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div style={pde.modalField}>
                  <label style={pde.modalLabel}>紐づける株（実IDを管理する場合）</label>
                  <select style={pde.modalSelect} value={planterPlantId}
                    onChange={e => setPlanterPlantId(e.target.value)}>
                    <option value="">未設定（実のID管理なし）</option>
                    {plantList.map(pl => (
                      <option key={pl.id} value={pl.id}>
                        {pl.variety}（ID: {pl.id}）
                      </option>
                    ))}
                  </select>
                </div>
                {modalErr && <div style={pde.errText}>{modalErr}</div>}
                <div style={pde.modalBtns}>
                  <button style={pde.modalBtnOk} onClick={confirmAddPlanter}>追加</button>
                  <button style={pde.modalBtnCa} onClick={() => setModal(null)}>キャンセル</button>
                </div>
              </>
            ) : (
              <>
                <h3 style={pde.modalTitle}>🌱 植物の種類を追加</h3>
                <div style={pde.modalField}>
                  <label style={pde.modalLabel}>名前</label>
                  <input style={pde.modalInput} type="text" value={newPlantName}
                    onChange={e => setNewPlantName(e.target.value)} placeholder="例: ミニトマト" autoFocus />
                </div>
                <div style={pde.modalField}>
                  <label style={pde.modalLabel}>実の色</label>
                  <div style={pde.colorRow}>
                    <input type="color" style={pde.colorInput} value={newPlantColor}
                      onChange={e => setNewPlantColor(e.target.value)} />
                    <div style={pde.colorPrev(newPlantColor)} />
                  </div>
                </div>
                {modalErr && <div style={pde.errText}>{modalErr}</div>}
                <div style={pde.modalBtns}>
                  <button style={pde.modalBtnOk} onClick={confirmAddPlant}>追加</button>
                  <button style={pde.modalBtnCa} onClick={() => setModal(null)}>キャンセル</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
