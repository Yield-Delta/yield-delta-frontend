/**
 * Enhanced risk level calculation for vault strategies
 * Considers both APY percentage and strategy-inherent risks
 */
export const getRiskLevel = (apy: number, strategy?: string): 'Low' | 'Medium' | 'High' => {
  const apyPercentage = apy * 100; // Convert decimal to percentage
  
  // Strategy-based risk adjustments
  const strategyRiskModifier: Record<string, number> = {
    'stable_max': -5,          // Stablecoin strategies are less risky
    'concentrated_liquidity': 5, // Concentrated liquidity has impermanent loss risk
    'arbitrage': 3,            // Arbitrage has execution risk
    'yield_farming': 2,        // Standard farming risk
    'hedge': 0,                // Hedge strategies are balanced
    'sei_hypergrowth': 8,      // High growth = high risk
    'blue_chip': -2,           // Blue chip assets are safer
    'delta_neutral': -3        // Delta neutral strategies reduce market risk
  };
  
  const modifier = strategy ? (strategyRiskModifier[strategy] || 0) : 0;
  const adjustedApy = apyPercentage + modifier;
  
  if (adjustedApy < 15) return 'Low'
  if (adjustedApy < 25) return 'Medium'
  return 'High'
}

/**
 * Get appropriate styling for risk badge based on risk level
 */
export const getRiskBadgeStyle = (riskLevel: 'Low' | 'Medium' | 'High') => {
  const styles = {
    Low: {
      background: 'linear-gradient(45deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.45))',
      color: '#d1fae5',
      border: '1px solid rgba(16, 185, 129, 0.6)',
      boxShadow: '0 0 12px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    },
    Medium: {
      background: 'linear-gradient(45deg, rgba(245, 158, 11, 0.25), rgba(245, 158, 11, 0.45))',
      color: '#fef3c7',
      border: '1px solid rgba(245, 158, 11, 0.6)',
      boxShadow: '0 0 12px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    },
    High: {
      background: 'linear-gradient(45deg, rgba(239, 68, 68, 0.25), rgba(239, 68, 68, 0.45))',
      color: '#fecaca',
      border: '1px solid rgba(239, 68, 68, 0.6)',
      boxShadow: '0 0 12px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    }
  }
  return styles[riskLevel]
}