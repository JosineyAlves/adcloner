'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

interface TableCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  indeterminate?: boolean
}

export default function TableCheckbox({
  checked,
  onChange,
  disabled = false,
  indeterminate = false
}: TableCheckboxProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  const getCheckboxClasses = () => {
    const baseClasses = "relative inline-flex items-center justify-center w-4 h-4 border-2 rounded transition-colors cursor-pointer"
    
    if (disabled) {
      return `${baseClasses} border-gray-300 bg-gray-100 cursor-not-allowed`
    }

    if (checked || indeterminate) {
      return `${baseClasses} border-blue-600 bg-blue-600 text-white`
    }

    if (isHovered) {
      return `${baseClasses} border-gray-400 bg-gray-50`
    }

    return `${baseClasses} border-gray-300 bg-white hover:border-gray-400`
  }

  return (
    <div
      className={getCheckboxClasses()}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      tabIndex={disabled ? -1 : 0}
    >
      {(checked || indeterminate) && (
        <Check className="w-3 h-3" />
      )}
    </div>
  )
}
