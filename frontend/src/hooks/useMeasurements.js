import { useEffect, useState, useCallback } from 'react'

// 指定した株の測定履歴を取得する。plantId が無いときは空。
export function useMeasurements(plantId) {
  const [measurements, setMeasurements] = useState([])
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    if (!plantId) {
      setMeasurements([])
      return
    }
    fetch(`/api/measurements?plant_id=${plantId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setMeasurements)
      .catch((err) => setError(err.message))
  }, [plantId])

  useEffect(() => {
    reload()
  }, [reload])

  return { measurements, error, reload }
}
