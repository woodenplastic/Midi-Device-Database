'use client'

import React, { useState, useEffect } from 'react'

type Theme = 'system' | 'light' | 'dark'

export default function DarkModeButton() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load theme from localStorage or default to system
    const savedTheme = localStorage.getItem('theme') as Theme || 'system'
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const body = document.body
    
    if (newTheme === 'system') {
      // Remove manual classes, let CSS media query handle it
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        body.classList.add('dark')
        body.classList.remove('light')
      } else {
        body.classList.add('light')
        body.classList.remove('dark')
      }
    } else {
      // Apply manual theme
      body.classList.remove('light', 'dark')
      body.classList.add(newTheme)
    }
  }

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark']
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    
    setTheme(nextTheme)
    applyTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
  }


  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Dark'
      case 'dark':
        return 'Light'
      default:
        return 'System'
    }
  }

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <button className="dark-mode-button">
      </button>
    )
  }

  return (
    <button
      className="dark-mode-button"
      onClick={cycleTheme}
      title={`Current theme: ${getThemeLabel()}. Click to cycle through themes.`}
    >
      <span>{getThemeLabel()}</span>
    </button>
  )
}