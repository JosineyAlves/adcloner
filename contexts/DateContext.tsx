'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface DateRange {
  since: string
  until: string
}

interface DateContextType {
  datePreset: string
  customRange: DateRange | undefined
  setDatePreset: (preset: string) => void
  setCustomRange: (range: DateRange | undefined) => void
  resetDate: () => void
}

const DateContext = createContext<DateContextType | undefined>(undefined)

export function DateProvider({ children }: { children: ReactNode }) {
  const [datePreset, setDatePreset] = useState('last_30d')
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined)

  const resetDate = () => {
    setDatePreset('last_30d')
    setCustomRange(undefined)
  }

  const value = {
    datePreset,
    customRange,
    setDatePreset,
    setCustomRange,
    resetDate
  }

  return (
    <DateContext.Provider value={value}>
      {children}
    </DateContext.Provider>
  )
}

export function useDate() {
  const context = useContext(DateContext)
  if (!context) {
    throw new Error('useDate must be used within a DateProvider')
  }
  return context
}
