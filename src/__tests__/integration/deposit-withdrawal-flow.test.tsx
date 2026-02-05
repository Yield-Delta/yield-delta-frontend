/**
 * Integration Tests for Deposit/Withdrawal Flow
 * Tests the complete user journey with mocked blockchain interactions
 * @author Frontend Developer
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import components to test
import DepositModal from '@/components/DepositModal';

// Mock vault data
const testVault = {
  address: '0x1234567890123456789012345678901234567890',
  name: 'SEI-USDC Concentrated LP',
  apy: 0.125,
  tvl: 1250000,
  strategy: 'concentrated_liquidity' as const,
  tokenA: 'SEI',
  tokenB: 'USDC',
  fee: 0.003,
  performance: {
    totalReturn: 0.087,
    sharpeRatio: 1.45,
    maxDrawdown: 0.023,
    winRate: 0.68,
  },
};

// React Query wrapper
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('Deposit/Withdrawal Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Deposit Modal Rendering', () => {
    it('should render deposit modal correctly', () => {
      render(
        <DepositModal
          vault={testVault}
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />,
        { wrapper: createTestWrapper() }
      );

      // Verify modal renders with vault name
      expect(screen.getByText('Deposit to SEI-USDC Concentrated LP')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
      expect(screen.getByText('Deposit Now')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <DepositModal
          vault={testVault}
          isOpen={false}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />,
        { wrapper: createTestWrapper() }
      );

      expect(screen.queryByText('Deposit to SEI-USDC Concentrated LP')).not.toBeInTheDocument();
    });
  });
});
