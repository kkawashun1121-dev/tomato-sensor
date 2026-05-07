import { useEffect, useState, useCallback } from 'react'

export function useWaterings(plantId) {
  const [waterings, setWaterings] = useState([])
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    if (!plantId) {
      setWaterings([])
      return
    }
    fetch(`/api/waterings?plant_id=${plantId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setWaterings)
      .catch((err) => setError(err.message))
  }, [plantId])

  useEffect(() => {
    reload()
  }, [reload])

  return { waterings, error, reload }
}