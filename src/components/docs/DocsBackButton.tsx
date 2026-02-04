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
          className="gap-2 hover:gap-3 transition-all duration-300 group"
          style={{
            background: 'linear-gradient(135deg, rgba(155, 93, 229, 0.08) 0%, rgba(0, 245, 212, 0.06) 100%)',
            border: '1px solid rgba(155, 93, 229, 0.3)',
            backdropFilter: 'blur(10px)',
            minHeight: '44px',
            minWidth: '44px',
            padding: '0.75rem 1.25rem',
          }}
        >
          <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
          <span className="font-semibold">{label}</span>
        </Button>
      </Link>
    </div>
  )
}
