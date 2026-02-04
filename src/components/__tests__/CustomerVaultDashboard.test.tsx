import React from 'react';
import { render, screen } from '@testing-library/react';
import CustomerVaultDashboard from '../CustomerVaultDashboard';

const mockVaultAddress = '0x1234567890123456789012345678901234567890';
import { Abi } from 'viem';

const mockVaultABI: Abi = [
  {
    type: 'function',
    name: 'getCustomerStats',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'shares', type: 'uint256', internalType: 'uint256' },
      { name: 'shareValue', type: 'uint256', internalType: 'uint256' },
      { name: 'totalDeposited', type: 'uint256', internalType: 'uint256' },
      { name: 'totalWithdrawn', type: 'uint256', internalType: 'uint256' },
      { name: 'depositTime', type: 'uint256', internalType: 'uint256' },
      { name: 'lockTimeRemaining', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getVaultInfo',
    inputs: [],
    outputs: [
        {
            type: 'tuple',
            name: 'info',
            components: [
                { name: 'token0', type: 'address', internalType: 'address' },
                { name: 'token1', type: 'address', internalType: 'address' },
                { name: 'strategy', type: 'string', internalType: 'string' },
                { name: 'totalValueLocked', type: 'uint256', internalType: 'uint256' },
                { name: 'poolFee', type: 'uint24', internalType: 'uint24' },
                { name: 'isActive', type: 'bool', internalType: 'bool' }
            ]
        }
    ],
    stateMutability: 'view'
  }
];

jest.mock('wagmi', () => ({
  useAccount: () => ({ address: '0xmockaddress' }),
  useReadContract: jest.fn(),
  useWriteContract: () => ({ writeContract: jest.fn(), isPending: false }),
}));

describe('CustomerVaultDashboard', () => {
  beforeEach(async () => {
    const { useReadContract } = await import('wagmi');
    (useReadContract as jest.Mock).mockImplementation(({ functionName }) => {
      if (functionName === 'getCustomerStats') {
        return { data: [1000, 1100, 1000, 0, 1672531200, 0] };
      }
      if (functionName === 'getVaultInfo') {
        return { data: { token0: 'TKA', token1: 'TKB', strategy: 'Test Strategy', totalValueLocked: 1000000, poolFee: 3000, isActive: true } };
      }
      return { data: null };
    });
  });

  it('renders the dashboard with data', () => {
    render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
    expect(screen.getByText('SEI DLP Vault Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Your Shares')).toBeInTheDocument();
  });
});