/**
 * DepositModal Component Tests
 * Tests the deposit modal UI behavior and user interactions
 * @author Frontend Developer
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DepositModal from '../DepositModal';
import { useDepositToVault } from '@/hooks/useVaults';

// Mock the deposit hook
jest.mock('@/hooks/useVaults', () => ({
  useDepositToVault: jest.fn(),
}));

// Mock vault data
const mockVault = {
  address: '0x1234567890123456789012345678901234567890',
  name: 'SEI-USDC Concentrated LP',
  apy: 0.125,
  tvl: 1250000,
  strategy: 'concentrated_liquidity',
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

// Create a wrapper with QueryClient for React Query
const createWrapper = () => {
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

describe('DepositModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockMutate = jest.fn();
  
  const mockDepositMutation = {
    mutate: mockMutate,
    isPending: false,
    isError: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useDepositToVault as jest.Mock).mockReturnValue(mockDepositMutation);
    
    // Mock document.body style for scroll lock
    Object.defineProperty(document.body, 'style', {
      value: {
        overflow: '',
        position: '',
        width: '',
      },
      writable: true,
    });
  });

  describe('Rendering and Visibility', () => {
    it('should not render when isOpen is false', () => {
      render(
        <DepositModal
          vault={mockVault}
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByText('Deposit to SEI-USDC Concentrated LP')).not.toBeInTheDocument();
    });

    it('should not render when vault is null', () => {
      render(
        <DepositModal
          vault={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByText('Deposit to')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true and vault exists', () => {
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Deposit to SEI-USDC Concentrated LP')).toBeInTheDocument();
      expect(screen.getByText('12.5% APY')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    });

    it('should display correct vault information', () => {
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('12.5%')).toBeInTheDocument();
      expect(screen.getByText('1.3M TVL')).toBeInTheDocument();
      expect(screen.getByText('Low Risk')).toBeInTheDocument();
      expect(screen.getByText('concentrated liquidity')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should update deposit amount when user types', async () => {
      const user = userEvent.setup();
      
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText('0.00');
      await user.type(input, '1000');

      expect(input).toHaveValue(1000);
      expect(screen.getByText('950.00')).toBeInTheDocument(); // 1000 * 0.95 share rate
    });

    it('should set preset amounts when quick deposit buttons are clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      const preset500Button = screen.getByText('$500');
      await user.click(preset500Button);

      const input = screen.getByPlaceholderText('0.00');
      expect(input).toHaveValue(500);
    });

    it('should highlight selected preset amount', async () => {
      const user = userEvent.setup();
      
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      const preset1000Button = screen.getByText('$1,000');
      await user.click(preset1000Button);

      // The button should have different styling when selected
      expect(preset1000Button.closest('button')).toHaveStyle({
        'border-color': 'rgb(0, 245, 212)', // vault color #00f5d4
      });
    });

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      // Click on the backdrop (the modal overlay)
      const backdrop = screen.getByTestId('modal-backdrop');
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Deposit Functionality', () => {
    it('should disable deposit button when amount is invalid', () => {
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      const depositButton = screen.getByText('Deposit Now');
      expect(depositButton).toBeDisabled();
    });

    it('should enable deposit button when valid amount is entered', async () => {
      const user = userEvent.setup();
      
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText('0.00');
      await user.type(input, '1000');

      const depositButton = screen.getByText('Deposit Now');
      expect(depositButton).not.toBeDisabled();
    });

    it('should call deposit mutation when deposit button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText('0.00');
      await user.type(input, '1000');

      const depositButton = screen.getByText('Deposit Now');
      await user.click(depositButton);

      expect(mockMutate).toHaveBeenCalledWith({
        vaultAddress: mockVault.address,
        amount: '1000',
      });
    });

    it('should show loading state during deposit', () => {
      const loadingMutation = {
        ...mockDepositMutation,
        isPending: true,
      };
      (useDepositToVault as jest.Mock).mockReturnValue(loadingMutation);

      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeDisabled();
    });
  });

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when modal opens', () => {
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.width).toBe('100%');
    });

    it('should unlock body scroll when modal closes', () => {
      const { rerender } = render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      // First, modal is open and body is locked
      expect(document.body.style.overflow).toBe('hidden');

      // Then, modal closes
      rerender(
        <DepositModal
          vault={mockVault}
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(document.body.style.overflow).toBe('');
      expect(document.body.style.position).toBe('');
      expect(document.body.style.width).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText('0.00');
      await user.type(input, '0');

      const depositButton = screen.getByText('Deposit Now');
      expect(depositButton).toBeDisabled();
    });

    it('should handle negative amount gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText('0.00');
      await user.type(input, '-100');

      const depositButton = screen.getByText('Deposit Now');
      expect(depositButton).toBeDisabled();
    });

    it('should handle very large amounts', async () => {
      const user = userEvent.setup();
      
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText('0.00');
      await user.type(input, '999999999');

      expect(screen.getByText('949,999,999.05')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText('0.00');
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('id', 'deposit-amount');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      render(
        <DepositModal
          vault={mockVault}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );

      // Tab through the modal elements
      await user.tab();
      expect(screen.getByPlaceholderText('0.00')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('$100').closest('button')).toHaveFocus();
    });
  });
});
