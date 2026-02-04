import type { MDXComponents } from 'mdx/types'
import { ReactNode } from 'react'

// Custom components for documentation
const CustomCallout = ({ type, children }: { type: 'info' | 'warning' | 'error' | 'success'; children: ReactNode }) => (
  <div className={`callout ${type}`}>
    {children}
  </div>
)

const CustomCodeBlock = ({ children, className, ...props }: { children: ReactNode; className?: string }) => (
  <pre className={className} {...props}>
    <code>{children}</code>
  </pre>
)

const CustomInlineCode = ({ children, ...props }: { children: ReactNode }) => (
  <code {...props}>{children}</code>
)

const CustomH1 = ({ children, ...props }: { children: ReactNode }) => (
  <h1 className="docs-h1" {...props}>{children}</h1>
)

const CustomH2 = ({ children, ...props }: { children: ReactNode }) => (
  <h2 className="docs-h2" {...props}>{children}</h2>
)

const CustomH3 = ({ children, ...props }: { children: ReactNode }) => (
  <h3 className="docs-h3" {...props}>{children}</h3>
)

const CustomLink = ({ href, children, ...props }: { href?: string; children: ReactNode }) => (
  <a 
    href={href} 
    className="docs-link" 
    target={href?.startsWith('http') ? '_blank' : undefined}
    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    {...props}
  >
    {children}
  </a>
)

const CustomTable = ({ children, ...props }: { children: ReactNode }) => (
  <div className="table-wrapper">
    <table {...props}>{children}</table>
  </div>
)

const CustomBlockquote = ({ children, ...props }: { children: ReactNode }) => (
  <blockquote className="docs-blockquote" {...props}>
    {children}
  </blockquote>
)

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Custom components
    Callout: CustomCallout,
    
    // Override default HTML elements with styled versions
    h1: CustomH1,
    h2: CustomH2,
    h3: CustomH3,
    a: CustomLink,
    code: CustomInlineCode,
    pre: CustomCodeBlock,
    table: CustomTable,
    blockquote: CustomBlockquote,
    
    // You can add more custom components here
    ...components,
  }
}