import React from 'react'

export default function AdsIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 16 16" 
      width="1em" 
      height="1em" 
      fill="currentColor" 
      className={className}
    >
      <g data-name="Layer 2">
        <g data-name="16">
          <rect 
            x="1.5" 
            y="1.5" 
            width="13" 
            height="13" 
            rx="1.25" 
            stroke="currentColor" 
            fill="none"
          />
          <circle cx="4.5" cy="4.5" r="1" />
          <path 
            strokeLinecap="round" 
            stroke="currentColor" 
            fill="none" 
            d="M7.5 4.5 12.5 4.5"
          />
        </g>
      </g>
    </svg>
  )
}
