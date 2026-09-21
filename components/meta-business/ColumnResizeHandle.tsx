'use client'

interface ColumnResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void
  onDoubleClick: () => void
  isResizing?: boolean
}

// Alça de redimensionamento reaproveitada em toda coluna ajustável das tabelas do Meta Ads
// Manager (Nome, Orçamento, colunas de métrica) — arrastar muda a largura, duplo-clique ajusta
// automaticamente ao conteúdo atual (ver hooks/useResizableColumns.ts). Fica posicionada de forma
// absoluta na borda direita da célula do cabeçalho, que precisa ser `relative` (ou `sticky`, que já
// conta como elemento posicionado) para isso funcionar.
export default function ColumnResizeHandle({ onMouseDown, onDoubleClick, isResizing = false }: ColumnResizeHandleProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onDoubleClick()
      }}
      onClick={(e) => e.stopPropagation()}
      title="Arraste para redimensionar • duplo-clique para ajustar ao conteúdo"
      className={`absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none z-10 ${
        isResizing ? 'bg-brand-500/70' : 'hover:bg-brand-400/50'
      }`}
    />
  )
}
