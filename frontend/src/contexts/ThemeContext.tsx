import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  } else {
    document.documentElement.classList.remove('light')
    document.documentElement.classList.add('dark')
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('dc-theme') as Theme | null
      return stored === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('dc-theme', theme)
  }, [theme])

  // Apply on mount immediately (avoids flash)
  useEffect(() => {
    applyTheme(theme)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
