import { useEffect, useState, useCallback } from 'react'

export function useImages() {
  const [images, setImages] = useState([])
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    fetch('/api/images')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setImages)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { images, error, reload }
}