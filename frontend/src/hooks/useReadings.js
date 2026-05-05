import { useEffect, useState } from 'react'

export function useReadings(hours = 24) {
  const [readings, setReadings] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(`/api/readings?limit=600&hours=${hours}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setReadings(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [hours])

  return { readings, error, loading }
}