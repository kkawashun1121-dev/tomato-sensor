import { useEffect, useState, useCallback } from 'react'

export function usePlants() {
  const [plants, setPlants] = useState([])
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    fetch('/api/plants')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setPlants)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { plants, error, reload }
}