import React from 'react'

export default function CampaignsIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 48 48" 
      width="1em" 
      height="1em" 
      fill="currentColor" 
      className={className}
    >
      <path 
        d="m19.95 8.76-.18-.53a4 4 0 0 0-3.79-2.74H6.5c-1.66 0-3 1.34-3 3v30c0 2.21 1.79 4 4 4h33c2.21 0 4-1.79 4-4V15.5c0-2.21-1.79-4-4-4H23.74c-1.72 0-3.25-1.1-3.79-2.74z" 
        stroke="currentColor" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="3px" 
        fill="none"
      />
      <path d="m30.9 32.57-5.95-12c-.17-.35-.54-.57-.95-.57s-.77.22-.95.57l-5.95 12c-.19.39-.1.86.23 1.16.33.3.83.36 1.23.14L24 30.98l5.44 2.89a1.075 1.075 0 0 0 1.23-.14c.33-.3.42-.76.23-1.16z" />
    </svg>
  )
}
