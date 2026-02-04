'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSeiWallet } from '@/hooks/useSeiWallet'
import { useAccount } from 'wagmi'

interface SeiWalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SeiWalletModal({ isOpen, onClose }: SeiWalletModalProps) {
  const { isConnected: isEvmConnected } = useAccount()
  const {
    isSeiConnected,
    seiAccounts,
    selectedSeiWallet,
    seiWalletError,
    connectSeiWallet,
    disconnectSeiWallet,
    SUPPORTED_SEI_WALLETS
  } = useSeiWallet()

  const [isConnecting, setIsConnecting] = useState<string | null>(null)

  const handleSeiWalletConnect = async (walletType: typeof SUPPORTED_SEI_WALLETS[number]['windowKey']) => {
    setIsConnecting(walletType)
    try {
      await connectSeiWallet(walletType)
      if (isEvmConnected) {
        // If both are connected, close modal
        onClose()
      }
    } finally {
      setIsConnecting(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md wallet-modal-override">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Connect to SEI Ecosystem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* EVM Wallet Status */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              EVM Wallet (for smart contracts)
            </h3>
            <Card className="p-3">
              {isEvmConnected ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">EVM wallet connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">Connect EVM wallet first</span>
                </div>
              )}
            </Card>
          </div>

          {/* Sei Cosmos Wallet */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Cosmos Wallet (for Sei native features)
            </h3>
            
            {isSeiConnected ? (
              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">
                      {selectedSeiWallet} connected
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnectSeiWallet}
                  >
                    Disconnect
                  </Button>
                </div>
                {seiAccounts.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {seiAccounts[0].slice(0, 8)}...{seiAccounts[0].slice(-6)}
                  </div>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_SEI_WALLETS.map((wallet) => (
                  <Card
                    key={wallet.windowKey}
                    className="p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => handleSeiWalletConnect(wallet.windowKey)}
                  >
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {wallet.name}
                      </div>
                      {isConnecting === wallet.windowKey && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Connecting...
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {seiWalletError && (
            <Card className="p-3 border-destructive/50 bg-destructive/10">
              <div className="text-sm text-destructive">
                {seiWalletError}
              </div>
            </Card>
          )}

          {/* Connection Status */}
          <div className="text-center">
            {isEvmConnected && isSeiConnected ? (
              <div className="text-sm text-green-600">
                ✅ Fully connected to SEI ecosystem
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Connect both wallets for full functionality
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            {isEvmConnected && isSeiConnected && (
              <Button
                onClick={onClose}
                className="flex-1"
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}