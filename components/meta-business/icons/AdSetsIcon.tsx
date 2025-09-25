import React from 'react'

export default function AdSetsIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 48 48" 
      width="1em" 
      height="1em" 
      fill="currentColor" 
      className={className}
    >
      <rect x="26" y="2" width="20" height="20" rx="4.5" ry="4.5" />
      <rect x="2" y="26" width="20" height="20" rx="4.5" ry="4.5" />
      <path d="M17.5 2h-11C4.02 2 2 4.02 2 6.5v11C2 19.98 4.02 22 6.5 22h11c2.48 0 4.5-2.02 4.5-4.5v-11C22 4.02 19.98 2 17.5 2zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zM41.5 26h-11c-2.48 0-4.5 2.02-4.5 4.5v11c0 2.48 2.02 4.5 4.5 4.5h11c2.48 0 4.5-2.02 4.5-4.5v-11c0-2.48-2.02-4.5-4.5-4.5zM36 40c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
    </svg>
  )
}
