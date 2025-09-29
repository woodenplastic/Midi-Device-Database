'use client'

import React, { useState } from 'react'
import { useAdmin } from '../hooks/useAdmin'
import AdminLogin from './AdminLogin'

export default function AdminButton() {
  const { isAdmin, loading, login, logout } = useAdmin()
  const [showLogin, setShowLogin] = useState(false)

  if (loading) {
    return (
      <div style={{
        padding: '8px 12px',
        border: '2px solid var(--border-color)',
        borderRadius: '8px',
        fontSize: '14px',
        color: 'var(--text-muted)'
      }}>
        Loading...
      </div>
    )
  }

  if (isAdmin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          padding: '6px 12px',
          backgroundColor: '#10b981',
          color: 'white',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Admin
        </span>
        <button
          onClick={logout}
          style={{
            padding: '8px 16px',
            border: '2px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--card-background)',
            color: 'var(--text-color)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444'
            e.currentTarget.style.borderColor = '#ef4444'
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--card-background)'
            e.currentTarget.style.borderColor = 'var(--border-color)'
            e.currentTarget.style.color = 'var(--text-color)'
          }}
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          padding: '6px 12px',
          backgroundColor: 'var(--background-muted)',
          color: 'var(--text-muted)',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          border: '1px solid var(--border-color)'
        }}>
          Read Only
        </span>
        <button
          onClick={() => setShowLogin(true)}
          style={{
            padding: '8px 16px',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            backgroundColor: '#3b82f6',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb'
            e.currentTarget.style.borderColor = '#2563eb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6'
            e.currentTarget.style.borderColor = '#3b82f6'
          }}
        >
          Admin Login
        </button>
      </div>

      {showLogin && (
        <AdminLogin
          onLogin={login}
          onClose={() => setShowLogin(false)}
        />
      )}
    </>
  )
}
