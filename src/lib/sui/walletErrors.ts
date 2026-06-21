const CANCELLATION_PATTERNS = [
  'user closed',
  'user rejected',
  'user denied',
  'wallet window closed',
  'request rejected',
  'request cancelled',
  'request canceled',
  'transaction cancelled',
  'transaction canceled',
]

export function isWalletCancellation(error: unknown): boolean {
  let current: unknown = error

  // Wallet SDKs often wrap the original rejection in one or more `cause`s.
  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (typeof current === 'string') {
      const message = current.toLowerCase()
      return CANCELLATION_PATTERNS.some((pattern) => message.includes(pattern))
    }

    if (typeof current !== 'object') return false

    const candidate = current as {
      code?: unknown
      message?: unknown
      cause?: unknown
    }

    if (candidate.code === 4001 || candidate.code === '4001') return true

    if (typeof candidate.message === 'string') {
      const message = candidate.message.toLowerCase()
      if (CANCELLATION_PATTERNS.some((pattern) => message.includes(pattern))) return true
    }

    current = candidate.cause
  }

  return false
}
