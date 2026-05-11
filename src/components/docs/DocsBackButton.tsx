'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DocsBackButtonProps {
  href?: string
  label?: string
}

export function DocsBackButton({
  href = '/docs',
  label = 'Back to Docs'
}: DocsBackButtonProps) {
  return (
    <div className="mb-6">
      <Link href={href}>
        <Button
          variant="outline"
          className="group gap-2 rounded-full text-sm font-semibold text-white/72 transition-all duration-300 hover:gap-3 hover:text-white"
          style={{
            background: 'rgba(0, 245, 212, 0.075)',
            border: '1px solid rgba(0, 245, 212, 0.32)',
            backdropFilter: 'blur(18px)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 12px 34px rgba(0, 245, 212, 0.08)',
            minHeight: '44px',
            minWidth: '44px',
            padding: '0.7rem 1rem',
          }}
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          <span className="font-semibold">{label}</span>
        </Button>
      </Link>
    </div>
  )
}
