'use client'

/**
 * Tooltip global no padrão visual do vmetrics (mesmo balão do gráfico "Horas sem Venda": fundo do
 * card, borda cinza, sombra leve, tema claro/escuro).
 *
 * Substitui o tooltip NATIVO do navegador (aquele campo preto com texto branco, que não pode ser
 * estilizado e muda conforme navegador/sistema) para qualquer elemento com o atributo `title`:
 * ao passar o mouse, o `title` é guardado e removido do elemento (evita o balão nativo), o balão do
 * vmetrics é exibido, e o `title` volta ao sair — a acessibilidade (leitores de tela) é mantida.
 *
 * Para remover: apagar este arquivo e a linha <VmetricsTooltip /> em app/layout.tsx.
 * Limitação conhecida: elementos `disabled` não disparam eventos de mouse em alguns navegadores;
 * neles o `title` continua usando o tooltip nativo.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const SHOW_DELAY_MS = 250

interface TipState {
  text: string
  x: number // posição horizontal do mouse quando o balão foi pedido
  rect: DOMRect // retângulo do elemento
}

export default function VmetricsTooltip() {
  const [tip, setTip] = useState<TipState | null>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let current: HTMLElement | null = null
    let saved = ''
    let timer: ReturnType<typeof setTimeout> | null = null

    const hide = () => {
      if (timer) { clearTimeout(timer); timer = null }
      if (current) {
        // Se o React já pôs um novo title enquanto o mouse estava em cima, mantém o novo.
        if (!current.hasAttribute('title')) current.setAttribute('title', saved)
        current = null
      }
      setTip(null)
      setPos(null)
    }

    const onOver = (e: MouseEvent) => {
      if (!window.matchMedia('(hover: hover)').matches) return
      const target = e.target
      if (!(target instanceof Element)) return
      // Ainda dentro do mesmo elemento (movendo entre filhos): mantém o balão.
      if (current && current.contains(target)) return
      if (current) hide()

      const el = target.closest('[title]') as HTMLElement | null
      if (!el) return
      const raw = el.getAttribute('title') || ''
      const text = raw.trim()
      if (!text) return

      current = el
      saved = raw
      el.removeAttribute('title') // impede o tooltip nativo
      const x = e.clientX
      timer = setTimeout(() => {
        if (current === el) setTip({ text, x, rect: el.getBoundingClientRect() })
      }, SHOW_DELAY_MS)
    }

    const onOut = (e: MouseEvent) => {
      if (!current) return
      const to = e.relatedTarget
      if (to instanceof Node && current.contains(to)) return
      hide()
    }

    // Se o elemento sumiu da tela com o mouse parado em cima, limpa o balão.
    const onMove = () => { if (current && !current.isConnected) hide() }

    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mousedown', hide)
    document.addEventListener('keydown', hide)
    window.addEventListener('scroll', hide, { capture: true, passive: true })
    window.addEventListener('blur', hide)
    return () => {
      hide()
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mousedown', hide)
      document.removeEventListener('keydown', hide)
      window.removeEventListener('scroll', hide, { capture: true } as EventListenerOptions)
      window.removeEventListener('blur', hide)
    }
  }, [])

  // Posiciona o balão abaixo do elemento (ou acima, se faltar espaço), sem sair da tela.
  useLayoutEffect(() => {
    if (!tip || !boxRef.current) return
    const box = boxRef.current.getBoundingClientRect()
    const margin = 8
    const left = Math.max(margin, Math.min(tip.x - box.width / 2, window.innerWidth - box.width - margin))
    let top = tip.rect.bottom + 6
    if (top + box.height > window.innerHeight - margin) top = Math.max(margin, tip.rect.top - box.height - 6)
    setPos({ left, top })
  }, [tip])

  if (!tip) return null
  return (
    <div
      ref={boxRef}
      role="tooltip"
      className="fixed z-[9999] pointer-events-none max-w-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-200 whitespace-pre-line"
      style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}
    >
      {tip.text}
    </div>
  )
}
