import { useEffect, useState, useCallback } from 'react'

export function useFruits() {
  const [fruits, setFruits] = useState([])
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    fetch('/api/fruits')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setFruits)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { fruits, error, reload }
}