'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Check, Copy } from 'lucide-react'

interface CodeBlockProps {
  code: string
  language?: string
  title?: string
  showLineNumbers?: boolean
}

/**
 * Produce JSX elements with syntax highlighting for a supported language.
 *
 * The function tokenizes the input code and wraps recognized tokens in <span> elements
 * using classes such as `hl-string`, `hl-keyword`, `hl-number`, `hl-function`, `hl-property`,
 * `hl-method`, `hl-type`, and `hl-bracket`.
 *
 * If `language` is 'text' or 'plaintext', the function returns the code as-is without
 * any highlighting.
 *
 * @param code - The source code to highlight.
 * @param language - Language identifier (examples: 'typescript', 'javascript', 'bash', 'json', 'solidity', 'text'). Unknown identifiers fall back to JavaScript-style rules.
 * @returns A React element with syntax-highlighted code.
 */
function highlightCode(code: string, language: string): React.ReactElement {
  // Don't apply syntax highlighting to plain text
  if (language === 'text' || language === 'plaintext') {
    return <>{code}</>
  }

  // Define token patterns for each language
  const tokenize = (code: string, language: string): Array<{ type: string; value: string }> => {
    const tokens: Array<{ type: string; value: string }> = []

    // Language-specific regex patterns
    const patterns: Record<string, Array<{ type: string; pattern: RegExp }>> = {
      javascript: [
        { type: 'comment', pattern: /\/\/.*|\/\*[\s\S]*?\*\// },
        { type: 'string', pattern: /(['"`])(?:\\.|(?!\1)[^\\])*\1/ },
        { type: 'keyword', pattern: /\b(const|let|var|function|async|await|return|if|else|for|while|do|break|continue|switch|case|default|try|catch|finally|throw|new|typeof|instanceof|this|super|class|extends|import|export|from|default|as|null|undefined|true|false)\b/ },
        { type: 'number', pattern: /\b\d+\.?\d*\b/ },
        { type: 'function', pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/ },
        { type: 'property', pattern: /\.[a-zA-Z_$][a-zA-Z0-9_$]*/ },
        { type: 'method', pattern: /\b(console|window|document|navigator|Math|JSON|Object|Array|String|Number|Boolean|Date|Promise)\b/ },
      ],
      typescript: [
        { type: 'comment', pattern: /\/\/.*|\/\*[\s\S]*?\*\// },
        { type: 'string', pattern: /(['"`])(?:\\.|(?!\1)[^\\])*\1/ },
        { type: 'keyword', pattern: /\b(const|let|var|function|async|await|return|if|else|for|while|do|break|continue|switch|case|default|try|catch|finally|throw|new|typeof|instanceof|this|super|class|extends|implements|interface|type|enum|namespace|import|export|from|default|as|null|undefined|true|false|public|private|protected|readonly|static)\b/ },
        { type: 'type', pattern: /:\s*([A-Z][a-zA-Z0-9_]*|string|number|boolean|void|any|unknown|never|object)\b/ },
        { type: 'number', pattern: /\b\d+\.?\d*\b/ },
        { type: 'function', pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/ },
        { type: 'property', pattern: /\.[a-zA-Z_$][a-zA-Z0-9_$]*/ },
      ],
      bash: [
        { type: 'comment', pattern: /#.*/ },
        { type: 'string', pattern: /(['"])(?:\\.|(?!\1)[^\\])*\1/ },
        { type: 'variable', pattern: /\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/ },
        { type: 'keyword', pattern: /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|export|source|alias|unset|set|echo|printf|read|cd|ls|pwd|mkdir|rm|cp|mv|touch|cat|grep|sed|awk|find|chmod|chown|curl|wget|git|npm|yarn|pnpm|bun|docker|kubectl|apt|apt-get|yum|brew|sudo|su|exit|break|continue)\b/ },
        { type: 'type', pattern: /(^|\s)--?[a-zA-Z][a-zA-Z0-9-]*/ },
        { type: 'number', pattern: /\b\d+\b/ },
      ],
      json: [
        { type: 'function', pattern: /"[^"]*"(?=\s*:)/ },
        { type: 'string', pattern: /:\s*"[^"]*"/ },
        { type: 'number', pattern: /:\s*-?\d+\.?\d*/ },
        { type: 'keyword', pattern: /\b(true|false|null)\b/ },
        { type: 'bracket', pattern: /[{}\[\],]/ },
      ],
      solidity: [
        { type: 'comment', pattern: /\/\/.*|\/\*[\s\S]*?\*\// },
        { type: 'string', pattern: /(['"])(?:\\.|(?!\1)[^\\])*\1/ },
        { type: 'keyword', pattern: /\b(pragma|solidity|contract|interface|library|struct|enum|event|function|modifier|constructor|fallback|receive|external|public|internal|private|pure|view|payable|returns|return|if|else|for|while|do|break|continue|throw|emit|new|delete|this|super|import|from|as|is|memory|storage|calldata|indexed)\b/ },
        { type: 'type', pattern: /\b(uint256|uint128|uint64|uint32|uint16|uint8|int256|int|address|bool|bytes32|bytes|string|mapping)\b/ },
        { type: 'number', pattern: /\b\d+\.?\d*\b/ },
        { type: 'function', pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/ },
        { type: 'property', pattern: /\.[a-zA-Z_$][a-zA-Z0-9_$]*/ },
      ],
    }

    const langPatterns = patterns[language] || patterns.javascript

    // Precompile regexes once before the loop
    const compiledPatterns = langPatterns.map(({ type, pattern }) => ({
      type,
      regex: new RegExp('^(' + pattern.source + ')', pattern.flags.replace('g', ''))
    }))

    let remaining = code

    while (remaining.length > 0) {
      let matched = false

      for (const { type, regex } of compiledPatterns) {
        const match = remaining.match(regex)

        if (match) {
          tokens.push({ type, value: match[0] })
          remaining = remaining.slice(match[0].length)
          matched = true
          break
        }
      }

      if (!matched) {
        tokens.push({ type: 'text', value: remaining[0] })
        remaining = remaining.slice(1)
      }
    }

    return tokens
  }

  const tokens = tokenize(code, language)

  return (
    <>
      {tokens.map((token, index) => {
        const className = token.type !== 'text' ? `hl-${token.type}` : ''
        return (
          <span key={index} className={className}>
            {token.value}
          </span>
        )
      })}
    </>
  )
}

/**
 * Render a styled, copyable code block with optional syntax highlighting, language badge, and line numbers.
 *
 * @param code - The source code to display.
 * @param language - Language identifier used for highlighting and the language badge (defaults to `'typescript'`).
 * @param title - Optional title shown beside the language badge.
 * @param showLineNumbers - When `true`, render line numbers alongside highlighted lines.
 * @returns A React element that displays the formatted, copy-enabled code block.
 */
export function CodeBlock({ code, language = 'typescript', title, showLineNumbers = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Intercept copy events to provide clean code
  useEffect(() => {
    const pre = preRef.current
    if (!pre) return

    const handleCopyEvent = (e: ClipboardEvent) => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      if (!pre.contains(range.commonAncestorContainer)) return

      // Prevent default and provide clean code
      e.preventDefault()
      e.clipboardData?.setData('text/plain', code)
    }

    pre.addEventListener('copy', handleCopyEvent)
    return () => pre.removeEventListener('copy', handleCopyEvent)
  }, [code])

  // Generate highlighted code
  const highlightedCode = highlightCode(code, language)

  // Memoize highlighted lines for line-numbered display
  const highlightedLines = useMemo(() => {
    return code.split('\n').map(line => ({
      original: line,
      highlighted: highlightCode(line, language)
    }))
  }, [code, language])

  // Language badge colors
  const getLanguageColor = (lang: string): { className: string; style: React.CSSProperties } => {
    const colorMap: Record<string, { className: string; bg: string; text: string; border: string }> = {
      javascript: {
        className: 'language-badge-javascript',
        bg: 'rgb(234 179 8 / 0.2)',
        text: 'rgb(250 204 21)',
        border: 'rgb(234 179 8 / 0.3)'
      },
      typescript: {
        className: 'language-badge-typescript',
        bg: 'rgb(59 130 246 / 0.2)',
        text: 'rgb(96 165 250)',
        border: 'rgb(59 130 246 / 0.3)'
      },
      bash: {
        className: 'language-badge-bash',
        bg: 'rgb(34 197 94 / 0.2)',
        text: 'rgb(74 222 128)',
        border: 'rgb(34 197 94 / 0.3)'
      },
      json: {
        className: 'language-badge-json',
        bg: 'rgb(168 85 247 / 0.2)',
        text: 'rgb(192 132 252)',
        border: 'rgb(168 85 247 / 0.3)'
      },
      solidity: {
        className: 'language-badge-solidity',
        bg: 'rgb(99 102 241 / 0.2)',
        text: 'rgb(129 140 248)',
        border: 'rgb(99 102 241 / 0.3)'
      },
      python: {
        className: 'language-badge-python',
        bg: 'rgb(6 182 212 / 0.2)',
        text: 'rgb(34 211 238)',
        border: 'rgb(6 182 212 / 0.3)'
      },
      text: {
        className: 'language-badge-text',
        bg: 'rgb(107 114 128 / 0.2)',
        text: 'rgb(156 163 175)',
        border: 'rgb(107 114 128 / 0.3)'
      },
    }

    const colors = colorMap[lang] || {
      className: 'language-badge-default',
      bg: 'rgb(100 116 139 / 0.2)',
      text: 'rgb(148 163 184)',
      border: 'rgb(100 116 139 / 0.3)'
    }

    return {
      className: colors.className,
      style: {
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }
    }
  }

  return (
    <>
      {/* Inject syntax highlighting styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .hl-comment { color: #6b7280; font-style: italic; }
          .hl-string { color: #34d399; }
          .hl-keyword { color: #a78bfa; }
          .hl-number { color: #fb923c; }
          .hl-function { color: #60a5fa; }
          .hl-property { color: #22d3ee; }
          .hl-method { color: #f472b6; }
          .hl-type { color: #fbbf24; }
          .hl-bracket { color: #94a3b8; }
          .hl-variable { color: #22d3ee; }
        `
      }} />

      <div className="code-block-wrapper group relative my-6">
        {/* Code container */}
        <div className="relative overflow-hidden rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.05),
              inset 0 0 60px rgba(6, 182, 212, 0.03),
              0 0 0 1px rgba(6, 182, 212, 0.1)
            `,
          }}
        >
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 rounded-lg opacity-70 hover:opacity-100 transition-all duration-300 z-20"
            style={{
              background: copied
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.1))'
                : 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
              border: copied
                ? '1px solid rgba(34, 197, 94, 0.4)'
                : '1px solid rgba(148, 163, 184, 0.3)',
              backdropFilter: 'blur(12px)',
              boxShadow: copied
                ? '0 4px 12px rgba(34, 197, 94, 0.2)'
                : '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
            aria-label={copied ? 'Copied!' : 'Copy code'}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Code content */}
          <pre
            ref={preRef}
            className="overflow-x-auto p-6 m-0 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent relative"
          >
            {/* Language badge */}
            {(language || title) && (
              <div className="flex items-center gap-3 mb-4">
                {title && (
                  <span className="text-sm font-medium text-slate-300">
                    {title}
                  </span>
                )}
                {language && language !== 'text' && (() => {
                  const { className, style } = getLanguageColor(language)
                  return (
                    <span
                      className={`inline-flex items-center px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded-full border-2 ${className}`}
                      style={style}
                    >
                      {language}
                    </span>
                  )
                })()}
              </div>
            )}

            {/* Render code with line numbers or without */}
            {showLineNumbers ? (
              <code className="block font-mono text-sm leading-relaxed text-slate-200">
                <table className="w-full border-collapse">
                  <tbody>
                    {highlightedLines.map((lineData, index) => {
                      return (
                        <tr key={`line-${index}`}>
                          <td className="pr-4 text-right select-none" style={{ color: 'rgba(148, 163, 184, 0.4)', verticalAlign: 'top' }}>
                            {index + 1}
                          </td>
                          <td className="text-slate-200">
                            {lineData.original.trim() === '' ? '\u00A0' : lineData.highlighted}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </code>
            ) : (
              <code className="block font-mono text-sm leading-relaxed text-slate-200">
                {highlightedCode}
              </code>
            )}
          </pre>
        </div>
      </div>
    </>
  )
}

/**
 * Render an inline monospace-styled code element suitable for embedding within text.
 *
 * @param children - Content to display inside the inline code element.
 * @param className - Optional additional CSS classes to apply to the element.
 * @returns A styled inline `<code>` element for short code snippets or identifiers.
 */
export function InlineCode({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-sm font-medium ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.1))',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        color: '#22d3ee',
        boxShadow: '0 0 10px rgba(6, 182, 212, 0.1)',
      }}
    >
      {children}
    </code>
  )
}