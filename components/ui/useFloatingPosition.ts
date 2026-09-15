'use client'

import { useState, useLayoutEffect, useCallback, RefObject } from 'react'

interface FloatingPosition {
  top: number
  left: number
}

// Hook de posicionamento "flutuante" — calcula onde um popover deve aparecer em relação ao seu
// elemento de disparo (trigger), para ser renderizado via portal em document.body com
// position: fixed. Isso resolve o corte/scroll indevido que ocorre quando um popover fica preso
// dentro de um container pai com overflow:hidden/auto ou largura limitada (era o caso do
// calendário customizado dentro do dropdown de período, e é o mesmo problema que os <select>
// nativos têm ao abrir sua lista de opções).
export function useFloatingPosition(
  triggerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  popoverWidth: number = 288,
  estimatedPopoverHeight: number = 360
) {
  const [position, setPosition] = useState<FloatingPosition>({ top: 0, left: 0 })

  const recalculate = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const gap = 4

    // Horizontal: alinha à esquerda do trigger, mas evita estourar a borda direita da viewport.
    let left = rect.left
    if (left + popoverWidth > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - popoverWidth - 8)
    }

    // Vertical: abre abaixo por padrão; se não houver espaço suficiente e houver mais espaço
    // acima, abre para cima do trigger.
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    const openAbove = spaceBelow < estimatedPopoverHeight && spaceAbove > spaceBelow
    const top = openAbove ? rect.top - estimatedPopoverHeight - gap : rect.bottom + gap

    setPosition({ top: Math.max(8, top), left })
  }, [triggerRef, popoverWidth, estimatedPopoverHeight])

  useLayoutEffect(() => {
    if (!isOpen) return
    recalculate()
    window.addEventListener('resize', recalculate)
    window.addEventListener('scroll', recalculate, true)
    return () => {
      window.removeEventListener('resize', recalculate)
      window.removeEventListener('scroll', recalculate, true)
    }
  }, [isOpen, recalculate])

  return position
}
