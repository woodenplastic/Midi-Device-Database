'use client'

import React, { useState } from 'react'

interface AdminLoginProps {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  onClose: () => void
}

export default function AdminLogin({ onLogin, onClose }: AdminLoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await onLogin(username, password)
    
    if (result.success) {
      onClose()
    } else {
      setError(result.error || 'Login failed')
    }
    
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-color)',
        padding: '32px',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '400px',
        margin: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{
          background: 'var(--bg-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
            Admin Login
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-color)',
              padding: '4px',
              borderRadius: '4px'
            }}
            title="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: 'var(--text-color)'
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'var(--input-background)',
                color: 'var(--text-color)',
                boxSizing: 'border-box'
              }}
              placeholder="Enter username"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: 'var(--text-color)'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'var(--input-background)',
                color: 'var(--text-color)',
                boxSizing: 'border-box'
              }}
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div style={{
              color: '#ef4444',
              marginBottom: '16px',
              padding: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 24px',
                border: '2px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--card-background)',
                color: 'var(--text-color)',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontSize: '16px',
                fontWeight: '500',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: 'var(--bg-color)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <p style={{ 
            margin: '0 0 12px 0', 
            fontSize: '14px', 
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}>
            <strong>🔒 Secure Authentication</strong><br />
            • Bcrypt password hashing<br />
            • JWT tokens with HTTP-only cookies<br />
            • Rate limiting & account lockout<br />
            • Session timeout protection
          </p>
          <p style={{ 
            margin: 0, 
            fontSize: '13px', 
            color: 'var(--text-color)',
            textAlign: 'center',
            fontFamily: 'monospace',
            backgroundColor: 'rgba(0,0,0,0.1)',
            padding: '8px',
            borderRadius: '4px'
          }}>
            <strong>adrianwild</strong> / ritter-preston-already-rookies<br />
            <strong>andreaskiesgen</strong> / cellular-teenage-gui-cartoon
          </p>
        </div>
      </div>
    </div>
  )
}
