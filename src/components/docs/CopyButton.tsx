'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
  text: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Renders a button that copies the provided text to the clipboard and shows brief visual and accessible feedback.
 *
 * @param text - The string to write to the clipboard when the button is clicked.
 * @param className - Optional additional CSS class names applied to the button.
 * @param style - Optional inline style object applied to the button.
 * @returns The copy button element; after a successful copy the button shows a check icon and sets its aria-label to "Copied!" for 2 seconds. 
 */
export function CopyButton({ text, className = '', style }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
      // Optionally show error state to user
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`p-2 rounded-lg transition-all duration-200 ${className}`}
      style={style}
      aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  )
}