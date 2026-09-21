'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface NameEditorProps {
  id: string
  currentName: string
  onUpdate: (id: string, name: string) => Promise<void>
  disabled?: boolean
  maxLength?: number
}

export default function NameEditor({
  id,
  currentName,
  onUpdate,
  disabled = false,
  maxLength = 400
}: NameEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(currentName)
  const [isUpdating, setIsUpdating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setName(currentName)
  }, [currentName])

  const handleStartEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setName(currentName)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setName(currentName)
  }

  const handleSave = async () => {
    if (disabled || isUpdating) return

    const trimmedName = name.trim()

    if (!trimmedName) {
      toast.error('O nome não pode ficar vazio')
      return
    }

    if (trimmedName.length > maxLength) {
      toast.error(`Nome muito longo (máximo ${maxLength} caracteres)`)
      return
    }

    if (trimmedName === currentName) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    try {
      await onUpdate(id, trimmedName)
      toast.success('Nome atualizado com sucesso')
      setIsEditing(false)
    } catch (error: any) {
      console.error('Erro ao atualizar nome:', error)

      const errorMessage = error?.message || error?.error || 'Erro ao atualizar nome'
      toast.error(errorMessage)

      setName(currentName)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center space-x-1 w-full bg-white border border-blue-300 rounded-lg shadow-sm">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          className="w-full px-2 py-1 text-sm border-0 rounded-lg focus:outline-none focus:ring-0 min-w-0"
          disabled={isUpdating}
        />

        <div className="flex items-center space-x-1 pr-1">
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Salvar"
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleCancel}
            disabled={isUpdating}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group flex items-center space-x-1 w-full rounded px-1 py-0.5 -mx-1 transition-all duration-200 ${
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700'
      }`}
      onClick={handleStartEdit}
      title={disabled ? 'Nome não pode ser editado' : 'Clique para editar o nome'}
    >
      <div className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1" title={currentName}>
        {currentName}
      </div>
      {!disabled && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <div className="w-3.5 h-3.5 text-gray-400 hover:text-blue-600">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L5.707 13.5a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5v-3.207a.5.5 0 0 1 .146-.353L12.146.146zM1.5 10.5V13h2.5L12.5 4.5 10 2 1.5 10.5z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
