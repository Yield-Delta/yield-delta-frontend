import { isWalletCancellation } from '../walletErrors'

describe('isWalletCancellation', () => {
  it.each([
    new Error('User closed the wallet window'),
    new Error('User rejected the request'),
    new Error('Transaction cancelled'),
    { code: 4001, message: 'Rejected' },
    { cause: { code: '4001' } },
  ])('recognizes wallet cancellation without treating it as an on-chain failure', (error) => {
    expect(isWalletCancellation(error)).toBe(true)
  })

  it('does not hide genuine transaction failures', () => {
    expect(isWalletCancellation(new Error('MoveAbort in deposit: EPaused'))).toBe(false)
  })
})
