import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Reference - Yield Delta Documentation',
  description: 'Complete API reference for Yield Delta - AI-powered yield optimization on SEI Network',
}

/**
 * Layout component that renders its children without adding any extra markup.
 *
 * @param children - Content to be rendered inside the layout
 * @returns The rendered children wrapped in a fragment
 */
export default function APIReferenceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}