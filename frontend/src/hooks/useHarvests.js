import { useEffect, useState, useCallback } from 'react'

export function useHarvests(plantId) {
  const [harvests, setHarvests] = useState([])
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    if (!plantId) {
      setHarvests([])
      return
    }
    fetch(`/api/harvests?plant_id=${plantId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setHarvests)
      .catch((err) => setError(err.message))
  }, [plantId])

  useEffect(() => {
    reload()
  }, [reload])

  return { harvests, error, reload }
}