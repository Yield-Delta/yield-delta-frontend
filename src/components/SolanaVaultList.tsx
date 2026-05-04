'use client'

import React, { useState } from 'react'
import SolanaVaultCard from './SolanaVaultCard'
import SolanaDepositModal from './SolanaDepositModal'
import SolanaWithdrawModal from './SolanaWithdrawModal'

interface SolanaVaultData {
  address: string
  name: string
  apy: number
  tvl: number
  strategy: string
  depositToken: string
  tokenMint?: string
  tokenDecimals?: number
  description: string
  userShares?: string
  userValue?: string
}

interface SolanaVaultListProps {
  vaults: SolanaVaultData[]
  userVaultPositions?: Map<string, { shares: string; value: string }>
}

export default function SolanaVaultList({ vaults, userVaultPositions }: SolanaVaultListProps) {
  const [selectedVault, setSelectedVault] = useState<SolanaVaultData | null>(null)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const vaultsWithPositions = vaults.map(vault => {
    const position = userVaultPositions?.get(vault.address)
    return {
      ...vault,
      userShares: position?.shares || '0',
      userValue: position?.value || '0'
    }
  })

  const handleDeposit = (vault: SolanaVaultData) => {
    setSelectedVault(vault)
    setShowDepositModal(true)
  }

  const handleWithdraw = (vault: SolanaVaultData) => {
    setSelectedVault(vault)
    setShowWithdrawModal(true)
  }

  const handleDepositSuccess = (txSignature: string) => {
    console.log('Deposit successful:', txSignature)
    setShowDepositModal(false)
    setSelectedVault(null)
  }

  const handleWithdrawSuccess = (txSignature: string) => {
    console.log('Withdrawal successful:', txSignature)
    setShowWithdrawModal(false)
    setSelectedVault(null)
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vaultsWithPositions.map((vault, index) => (
          <SolanaVaultCard
            key={vault.address}
            vault={vault}
            index={index}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
          />
        ))}
      </div>

      {vaults.length === 0 && (
        <div 
          className="text-center py-16 rounded-3xl"
          style={{ 
            background: 'rgba(153, 69, 255, 0.05)', 
            border: '1px dashed rgba(153, 69, 255, 0.2)' 
          }}
        >
          <div className="text-4xl mb-4">◎</div>
          <h3 className="text-xl font-bold text-white mb-2">No Solana Vaults Available</h3>
          <p className="text-white/50">
            Check back soon for new vault opportunities on Solana
          </p>
        </div>
      )}

      <SolanaDepositModal
        vault={selectedVault}
        isOpen={showDepositModal}
        onClose={() => {
          setShowDepositModal(false)
          setSelectedVault(null)
        }}
        onSuccess={handleDepositSuccess}
      />

      <SolanaWithdrawModal
        vault={selectedVault}
        isOpen={showWithdrawModal}
        onClose={() => {
          setShowWithdrawModal(false)
          setSelectedVault(null)
        }}
        onSuccess={handleWithdrawSuccess}
        userShares={selectedVault?.userShares}
        userValue={selectedVault?.userValue}
      />
    </div>
  )
}