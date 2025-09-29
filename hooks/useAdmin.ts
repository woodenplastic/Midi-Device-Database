'use client'

import { useState, useEffect } from 'react'

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/admin', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsAdmin(data.authenticated)
        setUsername(data.username || null)
      } else {
        setIsAdmin(false)
        setUsername(null)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setIsAdmin(false)
      setUsername(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (inputUsername: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: inputUsername, password }),
        credentials: 'include'
      })

      const data = await response.json()
      
      if (data.success) {
        setIsAdmin(true)
        setUsername(data.username)
        // Force a page reload to refresh all components
        window.location.reload()
        return { success: true }
      } else {
        return { success: false, error: data.message }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/admin', {
        method: 'DELETE',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsAdmin(false)
      setUsername(null)
      // Force a page reload to refresh all components
      window.location.reload()
    }
  }

  return {
    isAdmin,
    username,
    loading,
    login,
    logout
  }
}
