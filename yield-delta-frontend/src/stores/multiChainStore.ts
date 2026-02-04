/**
 * Multi-Chain Wallet Store
 * Manages wallet connections across EVM, Solana, and Sui chains
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import {
  ChainId,
  ChainType,
  WalletState,
  WalletStatus,
  MultiChainWalletState,
  Transaction,
} from '@/types/chain'
import { getChainMetadata } from '@/lib/chainConfig'

interface MultiChainStore extends MultiChainWalletState {
  // Recent transactions
  transactions: Transaction[]
  
  // UI state
  isChainSelectorOpen: boolean
  selectedChainForAction: ChainId | null
  
  // Actions - EVM Chains
  connectEvmWallet: (address: string, chainId: ChainId) => void
  disconnectEvmWallet: () => void
  updateEvmBalance: (balance: string) => void
  setEvmStatus: (status: WalletStatus) => void
  
  // Actions - Solana
  connectSolanaWallet: (address: string, chainId: ChainId) => void
  disconnectSolanaWallet: () => void
  updateSolanaBalance: (balance: string) => void
  setSolanaStatus: (status: WalletStatus) => void
  
  // Actions - Sui (Future)
  connectSuiWallet: (address: string, chainId: ChainId) => void
  disconnectSuiWallet: () => void
  updateSuiBalance: (balance: string) => void
  setSuiStatus: (status: WalletStatus) => void
  
  // Chain management
  setActiveChain: (chainId: ChainId) => void
  getActiveChainMetadata: () => ReturnType<typeof getChainMetadata> | null
  getActiveWalletState: () => WalletState | null
  isWalletConnectedForChain: (chainId: ChainId) => boolean
  
  // Transaction management
  addTransaction: (transaction: Transaction) => void
  updateTransactionStatus: (hash: string, status: Transaction['status']) => void
  getTransactionsByChain: (chainId: ChainId) => Transaction[]
  clearTransactions: () => void
  
  // UI Actions
  openChainSelector: () => void
  closeChainSelector: () => void
  setSelectedChainForAction: (chainId: ChainId | null) => void
  
  // Utility
  disconnectAll: () => void
  resetStore: () => void
}

const initialWalletState: WalletState = {
  address: null,
  balance: null,
  status: WalletStatus.DISCONNECTED,
  chainId: null,
  chainType: null,
}

export const useMultiChainStore = create<MultiChainStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        evm: { ...initialWalletState, chainType: ChainType.EVM },
        solana: { ...initialWalletState, chainType: ChainType.SOLANA },
        sui: { ...initialWalletState, chainType: ChainType.SUI },
        activeChain: null,
        transactions: [],
        isChainSelectorOpen: false,
        selectedChainForAction: null,

        // EVM Wallet Actions
        connectEvmWallet: (address, chainId) =>
          set((state) => ({
            evm: {
              ...state.evm,
              address,
              chainId,
              chainType: ChainType.EVM,
              status: WalletStatus.CONNECTED,
            },
            activeChain: chainId,
          })),

        disconnectEvmWallet: () =>
          set((state) => ({
            evm: { ...initialWalletState, chainType: ChainType.EVM },
            activeChain: state.activeChain === state.evm.chainId ? null : state.activeChain,
          })),

        updateEvmBalance: (balance) =>
          set((state) => ({
            evm: { ...state.evm, balance },
          })),

        setEvmStatus: (status) =>
          set((state) => ({
            evm: { ...state.evm, status },
          })),

        // Solana Wallet Actions
        connectSolanaWallet: (address, chainId) =>
          set((state) => ({
            solana: {
              ...state.solana,
              address,
              chainId,
              chainType: ChainType.SOLANA,
              status: WalletStatus.CONNECTED,
            },
            activeChain: chainId,
          })),

        disconnectSolanaWallet: () =>
          set((state) => ({
            solana: { ...initialWalletState, chainType: ChainType.SOLANA },
            activeChain: state.activeChain === state.solana.chainId ? null : state.activeChain,
          })),

        updateSolanaBalance: (balance) =>
          set((state) => ({
            solana: { ...state.solana, balance },
          })),

        setSolanaStatus: (status) =>
          set((state) => ({
            solana: { ...state.solana, status },
          })),

        // Sui Wallet Actions (Future)
        connectSuiWallet: (address, chainId) =>
          set((state) => ({
            sui: {
              ...state.sui,
              address,
              chainId,
              chainType: ChainType.SUI,
              status: WalletStatus.CONNECTED,
            },
            activeChain: chainId,
          })),

        disconnectSuiWallet: () =>
          set((state) => ({
            sui: { ...initialWalletState, chainType: ChainType.SUI },
            activeChain: state.activeChain === state.sui.chainId ? null : state.activeChain,
          })),

        updateSuiBalance: (balance) =>
          set((state) => ({
            sui: { ...state.sui, balance },
          })),

        setSuiStatus: (status) =>
          set((state) => ({
            sui: { ...state.sui, status },
          })),

        // Chain Management
        setActiveChain: (chainId) =>
          set({ activeChain: chainId }),

        getActiveChainMetadata: () => {
          const { activeChain } = get()
          return activeChain ? getChainMetadata(activeChain) : null
        },

        getActiveWalletState: () => {
          const { activeChain, evm, solana, sui } = get()
          if (!activeChain) return null

          const metadata = getChainMetadata(activeChain)
          switch (metadata.type) {
            case ChainType.EVM:
              return evm
            case ChainType.SOLANA:
              return solana
            case ChainType.SUI:
              return sui
            default:
              return null
          }
        },

        isWalletConnectedForChain: (chainId) => {
          const { evm, solana, sui } = get()
          const metadata = getChainMetadata(chainId)

          switch (metadata.type) {
            case ChainType.EVM:
              return evm.status === WalletStatus.CONNECTED && evm.chainId === chainId
            case ChainType.SOLANA:
              return solana.status === WalletStatus.CONNECTED && solana.chainId === chainId
            case ChainType.SUI:
              return sui.status === WalletStatus.CONNECTED && sui.chainId === chainId
            default:
              return false
          }
        },

        // Transaction Management
        addTransaction: (transaction) =>
          set((state) => ({
            transactions: [transaction, ...state.transactions].slice(0, 100), // Keep last 100
          })),

        updateTransactionStatus: (hash, status) =>
          set((state) => ({
            transactions: state.transactions.map((tx) =>
              tx.hash === hash ? { ...tx, status } : tx
            ),
          })),

        getTransactionsByChain: (chainId) => {
          return get().transactions.filter((tx) => tx.chainId === chainId)
        },

        clearTransactions: () => set({ transactions: [] }),

        // UI Actions
        openChainSelector: () => set({ isChainSelectorOpen: true }),
        closeChainSelector: () => set({ isChainSelectorOpen: false }),
        setSelectedChainForAction: (chainId) => set({ selectedChainForAction: chainId }),

        // Utility
        disconnectAll: () =>
          set({
            evm: { ...initialWalletState, chainType: ChainType.EVM },
            solana: { ...initialWalletState, chainType: ChainType.SOLANA },
            sui: { ...initialWalletState, chainType: ChainType.SUI },
            activeChain: null,
            transactions: [],
          }),

        resetStore: () =>
          set({
            evm: { ...initialWalletState, chainType: ChainType.EVM },
            solana: { ...initialWalletState, chainType: ChainType.SOLANA },
            sui: { ...initialWalletState, chainType: ChainType.SUI },
            activeChain: null,
            transactions: [],
            isChainSelectorOpen: false,
            selectedChainForAction: null,
          }),
      }),
      {
        name: 'multichain-wallet-store',
        partialize: (state) => ({
          // Only persist essential data
          activeChain: state.activeChain,
          // Don't persist sensitive wallet data
        }),
      }
    ),
    {
      name: 'MultiChainStore',
    }
  )
)
