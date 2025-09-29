'use client'

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useAdmin } from '../hooks/useAdmin'

export default function SvgUploader() {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isAdmin } = useAdmin()

  const handleFileUpload = async (files: FileList) => {
    setUploading(true)
    const formData = new FormData()
    
    const validFiles: File[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        validFiles.push(file)
        formData.append('files', file)
      }
    }

    if (validFiles.length === 0) {
      alert('Please select only SVG files')
      setUploading(false)
      return
    }

    try {
      const response = await fetch('/api/upload-svg', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Include cookies for authentication
      })

      if (!response.ok) {
        throw new Error('Failed to upload files')
      }

      const result = await response.json()
      setUploadedFiles(prev => [...prev, ...result.filenames])
      alert(`Successfully uploaded ${result.filenames.length} file(s)`)
    } catch (err) {
      alert('Failed to upload files: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files)
    }
  }

  const loadExistingFiles = async () => {
    try {
      const response = await fetch('/api/list-svg')
      if (response.ok) {
        const files = await response.json()
        setUploadedFiles(files)
      }
    } catch (err) {
      console.error('Failed to load existing files:', err)
    }
  }

  React.useEffect(() => {
    loadExistingFiles()
  }, [])

  return (
    <div>
      <div 
        className={`upload-area ${dragOver ? 'dragover' : ''}`}
        style={{
          border: dragOver ? '2px dashed #3182ce' : '2px dashed #cbd5e0',
          backgroundColor: dragOver ? '#bee3f8' : 'var(--bg-color)',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          transition: 'all 0.2s',
          marginBottom: '20px'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div>
            <p style={{ fontSize: '18px', fontWeight: '600' }}>Uploading...</p>
          </div>
        ) : (
          <div>
            <svg 
              style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: 'var(--text-color)' }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Drag and drop SVG files here
            </p>
            <p style={{ color: 'var(--text-color)', marginBottom: '8px' }}>
              or
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-color)', marginBottom: '16px', fontStyle: 'italic' }}>
              <strong>Naming format:</strong> manufacturer_devicename.svg<br/>
              Example: roland_ju-06a.svg, moog_minitaur.svg
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Choose Files
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".svg,image/svg+xml"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {uploadedFiles.length > 0 && (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ marginBottom: '12px', color: 'var(--section-title-color)' }}>
            Uploaded SVG Files ({uploadedFiles.length}):
          </h4>
          <div style={{ maxHeight: '300px', overflowY: 'auto',  border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
            {uploadedFiles.map((filename, index) => (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px',
                  marginBottom: '4px',
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <svg style={{ width: '16px', height: '16px', marginRight: '8px', color: 'var(--text-color)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <span style={{ fontSize: '14px' }}>{filename}</span>
                </div>
                <a
                  href={`/api/download-svg/${filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'none',
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}