'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

type ThemeContextType = {
  theme: Theme
  isDarkMode: boolean
  setTheme: (theme: Theme) => void
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    // Save theme preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }

    // Apply theme based on preference or system
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
      setIsDarkMode(true)
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark')
      setIsDarkMode(false)
    } else if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemPrefersDark) {
        document.documentElement.classList.add('dark')
        setIsDarkMode(true)
      } else {
        document.documentElement.classList.remove('dark')
        setIsDarkMode(false)
      }
    }
  }

  // Set theme and apply it
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    applyTheme(newTheme)
  }

  // Toggle between light and dark mode
  const toggleDarkMode = () => {
    const newTheme = isDarkMode ? 'light' : 'dark'
    setTheme(newTheme)
  }

  // Initialize theme on mount
  useEffect(() => {
    // Check URL for theme parameter
    const urlParams = new URLSearchParams(window.location.search)
    const urlTheme = urlParams.get('theme')
    
    // Check localStorage for saved preference
    const savedTheme = localStorage.getItem('theme') as Theme | null
    
    // Determine initial theme
    let initialTheme: Theme = 'system'
    
    if (urlTheme === 'dark' || urlTheme === 'light') {
      initialTheme = urlTheme
    } else if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system') {
      initialTheme = savedTheme
    }
    
    setThemeState(initialTheme)
    applyTheme(initialTheme)
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setTheme, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 