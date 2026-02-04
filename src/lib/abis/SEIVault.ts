export const SEIVaultABI = [
  // Constructor
  {
    "type": "constructor",
    "inputs": [
      {"name": "_asset", "type": "address"},
      {"name": "_name", "type": "string"},
      {"name": "_symbol", "type": "string"},
      {"name": "_owner", "type": "address"},
      {"name": "_aiModel", "type": "address"}
    ],
    "stateMutability": "nonpayable"
  },

  // View Functions
  {
    "type": "function",
    "name": "asset",
    "inputs": [],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalAssets",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getVaultInfo",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {"name": "name", "type": "string"},
          {"name": "strategy", "type": "string"},
          {"name": "token0", "type": "address"},
          {"name": "token1", "type": "address"},
          {"name": "poolFee", "type": "uint24"},
          {"name": "totalSupply", "type": "uint256"},
          {"name": "totalValueLocked", "type": "uint256"},
          {"name": "isActive", "type": "bool"}
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCurrentPosition",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {"name": "tickLower", "type": "int24"},
          {"name": "tickUpper", "type": "int24"},
          {"name": "liquidity", "type": "uint128"},
          {"name": "tokensOwed0", "type": "uint256"},
          {"name": "tokensOwed1", "type": "uint256"},
          {"name": "feeGrowthInside0LastX128", "type": "uint256"},
          {"name": "feeGrowthInside1LastX128", "type": "uint256"}
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCustomerStats",
    "inputs": [{"name": "customer", "type": "address"}],
    "outputs": [
      {"name": "shares", "type": "uint256"},
      {"name": "shareValue", "type": "uint256"},
      {"name": "totalDeposited", "type": "uint256"},
      {"name": "totalWithdrawn", "type": "uint256"},
      {"name": "depositTime", "type": "uint256"},
      {"name": "lockTimeRemaining", "type": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getSEIChainId",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "parallelExecutionEnabled",
    "inputs": [],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLastFinalityOptimization",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{"name": "account", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "allowance",
    "inputs": [
      {"name": "owner", "type": "address"},
      {"name": "spender", "type": "address"}
    ],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "customerTotalDeposited",
    "inputs": [{"name": "", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "customerTotalWithdrawn",
    "inputs": [{"name": "", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "customerDepositTime",
    "inputs": [{"name": "", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },

  // State-Changing Functions
  {
    "type": "function",
    "name": "deposit",
    "inputs": [
      {"name": "amount0", "type": "uint256"},
      {"name": "amount1", "type": "uint256"},
      {"name": "recipient", "type": "address"}
    ],
    "outputs": [{"name": "shares", "type": "uint256"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [
      {"name": "shares", "type": "uint256"},
      {"name": "recipient", "type": "address"}
    ],
    "outputs": [
      {"name": "amount0", "type": "uint256"},
      {"name": "amount1", "type": "uint256"}
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "seiOptimizedDeposit",
    "inputs": [
      {"name": "amount", "type": "uint256"},
      {"name": "recipient", "type": "address"}
    ],
    "outputs": [{"name": "shares", "type": "uint256"}],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "seiOptimizedWithdraw",
    "inputs": [
      {"name": "shares", "type": "uint256"},
      {"name": "owner", "type": "address"},
      {"name": "recipient", "type": "address"}
    ],
    "outputs": [{"name": "assets", "type": "uint256"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "rebalance",
    "inputs": [
      {
        "name": "params",
        "type": "tuple",
        "components": [
          {"name": "newTickLower", "type": "int24"},
          {"name": "newTickUpper", "type": "int24"},
          {"name": "minAmount0", "type": "uint256"},
          {"name": "minAmount1", "type": "uint256"},
          {"name": "deadline", "type": "uint256"},
          {"name": "aiSignature", "type": "bytes"}
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "validateSEIChain",
    "inputs": [],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setParallelExecution",
    "inputs": [{"name": "enabled", "type": "bool"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "optimizeForFinality",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transfer",
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferFrom",
    "inputs": [
      {"name": "from", "type": "address"},
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable"
  },

  // Events
  {
    "type": "event",
    "name": "VaultCreated",
    "inputs": [
      {"name": "vault", "type": "address", "indexed": true},
      {"name": "name", "type": "string", "indexed": false},
      {"name": "token0", "type": "address", "indexed": false},
      {"name": "token1", "type": "address", "indexed": false}
    ]
  },
  {
    "type": "event",
    "name": "SEIOptimizedDeposit",
    "inputs": [
      {"name": "user", "type": "address", "indexed": true},
      {"name": "amount", "type": "uint256", "indexed": false},
      {"name": "shares", "type": "uint256", "indexed": false},
      {"name": "blockTime", "type": "uint256", "indexed": false}
    ]
  },
  {
    "type": "event",
    "name": "SEIOptimizedWithdraw",
    "inputs": [
      {"name": "user", "type": "address", "indexed": true},
      {"name": "amount", "type": "uint256", "indexed": false},
      {"name": "shares", "type": "uint256", "indexed": false},
      {"name": "blockTime", "type": "uint256", "indexed": false}
    ]
  },
  {
    "type": "event",
    "name": "PositionRebalanced",
    "inputs": [
      {"name": "oldTickLower", "type": "int24", "indexed": false},
      {"name": "oldTickUpper", "type": "int24", "indexed": false},
      {"name": "newTickLower", "type": "int24", "indexed": false},
      {"name": "newTickUpper", "type": "int24", "indexed": false}
    ]
  },
  {
    "type": "event",
    "name": "ParallelExecutionEnabled",
    "inputs": [
      {"name": "enabled", "type": "bool", "indexed": false}
    ]
  },
  {
    "type": "event",
    "name": "FinalityOptimized",
    "inputs": [
      {"name": "blockTime", "type": "uint256", "indexed": false},
      {"name": "executionBatch", "type": "uint256", "indexed": false}
    ]
  },
  {
    "type": "event",
    "name": "SEIChainValidated",
    "inputs": [
      {"name": "chainId", "type": "uint256", "indexed": false},
      {"name": "isValid", "type": "bool", "indexed": false}
    ]
  },
  {
    "type": "event",
    "name": "AIRebalanceExecuted",
    "inputs": [
      {"name": "aiRequestId", "type": "bytes32", "indexed": true},
      {"name": "gasUsed", "type": "uint256", "indexed": false}
    ]
  },
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      {"name": "from", "type": "address", "indexed": true},
      {"name": "to", "type": "address", "indexed": true},
      {"name": "value", "type": "uint256", "indexed": false}
    ]
  },
  {
    "type": "event",
    "name": "Approval",
    "inputs": [
      {"name": "owner", "type": "address", "indexed": true},
      {"name": "spender", "type": "address", "indexed": true},
      {"name": "value", "type": "uint256", "indexed": false}
    ]
  },

  // Receive and Fallback
  {
    "type": "receive",
    "stateMutability": "payable"
  },
  {
    "type": "fallback",
    "stateMutability": "payable"
  }
] as const;

export default SEIVaultABI;
