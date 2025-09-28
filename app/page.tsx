'use client'

import React, { useState, useEffect } from 'react'
import { MidiDatabase } from '../types/midi'
import DeviceEditor from '../components/DeviceEditor'
import SvgUploader from '../components/SvgUploader'

export default function HomePage() {
  const [database, setDatabase] = useState<MidiDatabase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDatabase()
  }, [])

  const loadDatabase = async () => {
    try {
      const response = await fetch('/api/database')
      if (!response.ok) {
        throw new Error('Failed to load database')
      }
      const data = await response.json()
      setDatabase(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load database')
    } finally {
      setLoading(false)
    }
  }

  const saveDatabase = async (updatedDatabase: MidiDatabase) => {
    try {
      const response = await fetch('/api/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedDatabase),
      })

      if (!response.ok) {
        throw new Error('Failed to save database')
      }

      setDatabase(updatedDatabase)
      //alert('Database saved successfully!')
    } catch (err) {
      alert('Failed to save database: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading MIDI Database...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h2>Error: {error}</h2>
        <button onClick={loadDatabase} style={{ marginTop: '10px', padding: '8px 16px' }}>
          Retry
        </button>
      </div>
    )
  }

  if (!database) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>No database found</h2>
      </div>
    )
  }

  return (
    <div style={{ padding: 'clamp(10px, 2vw, 20px)' }}>
      <div className="main-grid">
        <div className="editor-section">
          <DeviceEditor 
            database={database}
            onSave={saveDatabase}
          />
        </div>
        <div className="upload-section">
          <h2 className="section-title">SVG Icon Upload</h2>
          <SvgUploader />
        </div>
      </div>
    </div>
  )
}