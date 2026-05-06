import { useEffect, useState } from 'react'

export function useEnvironments(limit = 50) {
  const [environments, setEnvironments] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/api/environments?limit=${limit}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => setEnvironments(data))
      .catch((err) => setError(err.message))
  }, [limit])

  return { environments, error }
}