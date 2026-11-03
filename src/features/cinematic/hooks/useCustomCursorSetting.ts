import { useState, useEffect, useCallback } from 'react'

const CURSOR_SETTING_STORAGE_KEY = 'junction_cinema_cursor_v1'
const CURSOR_SETTING_EVENT = 'junction_cinema_cursor_changed'

function applyCursorClassToDOM(enabled: boolean) {
  if (typeof document === 'undefined') return
  const isFinePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
  if (enabled && isFinePointer) {
    document.body.classList.add('has-cinema-cursor')
  } else {
    document.body.classList.remove('has-cinema-cursor')
  }
}

/**
 * Hook to manage the user's preference for the custom cinema projector cursor.
 * Defaults to true on fine-pointer desktop environments.
 * Syncs across components and browser tabs.
 */
export function useCustomCursorSetting() {
  const [isCursorEnabled, setIsCursorEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    try {
      const stored = localStorage.getItem(CURSOR_SETTING_STORAGE_KEY)
      if (stored !== null) {
        return stored === 'true'
      }
    } catch {
      // Fallback
    }
    return true
  })

  // Synchronize across tabs and within tab
  useEffect(() => {
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>
      if (customEvent.detail && typeof customEvent.detail.enabled === 'boolean') {
        setIsCursorEnabled(customEvent.detail.enabled)
        applyCursorClassToDOM(customEvent.detail.enabled)
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CURSOR_SETTING_STORAGE_KEY && e.newValue !== null) {
        const enabled = e.newValue === 'true'
        setIsCursorEnabled(enabled)
        applyCursorClassToDOM(enabled)
      }
    }

    window.addEventListener(CURSOR_SETTING_EVENT, handleCustomChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener(CURSOR_SETTING_EVENT, handleCustomChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const toggleCursor = useCallback(() => {
    const next = !isCursorEnabled
    setIsCursorEnabled(next)
    applyCursorClassToDOM(next)
    try {
      localStorage.setItem(CURSOR_SETTING_STORAGE_KEY, String(next))
      window.dispatchEvent(
        new CustomEvent(CURSOR_SETTING_EVENT, { detail: { enabled: next } })
      )
    } catch (err) {
      console.warn('Failed to save cinema cursor preference:', err)
    }
  }, [isCursorEnabled])

  const setCursorEnabled = useCallback((enabled: boolean) => {
    setIsCursorEnabled(enabled)
    applyCursorClassToDOM(enabled)
    try {
      localStorage.setItem(CURSOR_SETTING_STORAGE_KEY, String(enabled))
      window.dispatchEvent(
        new CustomEvent(CURSOR_SETTING_EVENT, { detail: { enabled } })
      )
    } catch (err) {
      console.warn('Failed to save cinema cursor preference:', err)
    }
  }, [])

  return {
    isCursorEnabled,
    toggleCursor,
    setCursorEnabled,
  }
}
