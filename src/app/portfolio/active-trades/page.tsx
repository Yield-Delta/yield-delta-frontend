"use client"

import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle, AlertCircle, TrendingUp, Zap, Eye, BarChart3, ArrowRight } from 'lucide-react';

interface ActiveTrade {
  id: string;
  type: 'rebalance' | 'deposit' | 'withdraw' | 'swap';
  status: 'pending' | 'executing' | 'completed' | 'failed';
  fromToken: string;
  toToken?: string;
  amount: number;
  txHash?: string;
  startTime: Date;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  gasUsed?: number;
  vault?: string;
  progress: number; // 0-100
}

const ActiveTradesPage = () => {
  const [trades, setTrades] = useState<ActiveTrade[]>([
    {
      id: '1',
      type: 'rebalance',
      status: 'executing',
      fromToken: 'SEI',
      toToken: 'ATOM',
      amount: 500,
      startTime: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      estimatedCompletion: new Date(Date.now() + 1 * 60 * 1000), // 1 minute from now
      vault: 'ATOM-SEI LP',
      progress: 65,
      txHash: '0x1234...5678'
    },
    {
      id: '2',
      type: 'deposit',
      status: 'completed',
      fromToken: 'USDC',
      amount: 1000,
      startTime: new Date(Date.now() - 5 * 60 * 1000),
      actualCompletion: new Date(Date.now() - 3 * 60 * 1000),
      vault: 'Delta Neutral Vault',
      progress: 100,
      gasUsed: 0.002,
      txHash: '0xabcd...efgh'
    },
    {
      id: '3',
      type: 'swap',
      status: 'pending',
      fromToken: 'ETH',
      toToken: 'SEI',
      amount: 0.5,
      startTime: new Date(),
      estimatedCompletion: new Date(Date.now() + 2 * 60 * 1000),
      progress: 15
    }
  ]);

  // Simulate trade progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTrades(prevTrades => 
        prevTrades.map(trade => {
          if (trade.status === 'executing' && trade.progress < 100) {
            const newProgress = Math.min(trade.progress + Math.random() * 10, 100);
            return {
              ...trade,
              progress: newProgress,
              status: newProgress >= 100 ? 'completed' : 'executing',
              actualCompletion: newProgress >= 100 ? new Date() : undefined
            };
          }
          if (trade.status === 'pending' && Math.random() > 0.7) {
            return { ...trade, status: 'executing', progress: 5 };
          }
          return trade;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'executing': return 'text-blue-400 bg-blue-400/10';
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'failed': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'executing': return <Activity className="w-5 h-5 animate-pulse" />;
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'failed': return <AlertCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rebalance': return <BarChart3 className="w-5 h-5 text-purple-400" />;
      case 'deposit': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'withdraw': return <TrendingUp className="w-5 h-5 text-red-400 rotate-180" />;
      case 'swap': return <ArrowRight className="w-5 h-5 text-blue-400" />;
      default: return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const formatTimeUntil = (date: Date) => {
    const seconds = Math.floor((date.getTime() - Date.now()) / 1000);
    if (seconds <= 0) return 'Now';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const activeTrades = trades.filter(t => t.status === 'executing' || t.status === 'pending');
  const completedTrades = trades.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-400 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Active Trades
                </h1>
                <p className="text-gray-400 mt-1">Monitor your trades in real-time on SEI</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Active Trades</div>
                <div className="text-2xl font-bold text-green-400">{activeTrades.length}</div>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Executing', value: activeTrades.length, color: 'blue' },
            { label: 'Completed Today', value: completedTrades.length, color: 'green' },
            { label: 'Success Rate', value: '98.2%', color: 'purple' },
            { label: 'Avg Execution', value: '45s', color: 'orange' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="text-gray-400 text-sm mb-1">{stat.label}</div>
              <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Active Trades */}
        {activeTrades.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Live Execution ({activeTrades.length})
            </h2>
            
            <div className="space-y-4">
              {activeTrades.map((trade) => (
                <div key={trade.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-800 rounded-lg">
                        {getTypeIcon(trade.type)}
                      </div>
                      <div>
                        <div className="font-semibold capitalize">{trade.type}</div>
                        <div className="text-sm text-gray-400">
                          {trade.amount} {trade.fromToken}
                          {trade.toToken && ` → ${trade.toToken}`}
                          {trade.vault && ` (${trade.vault})`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2 ${getStatusColor(trade.status)}`}>
                          {getStatusIcon(trade.status)}
                          {trade.status}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {trade.status === 'pending' ? `Started ${formatTimeAgo(trade.startTime)}` : 
                           trade.estimatedCompletion ? `ETA: ${formatTimeUntil(trade.estimatedCompletion)}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white font-medium">{trade.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          trade.status === 'executing' ? 'bg-gradient-to-r from-blue-400 to-purple-400' : 'bg-green-400'
                        }`}
                        style={{ width: `${trade.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Transaction Hash */}
                  {trade.txHash && (
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">Transaction Hash</div>
                        <button className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          View on SeiTrace
                        </button>
                      </div>
                      <div className="font-mono text-sm mt-1 text-gray-300">{trade.txHash}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Completed Trades */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Recent Completions
          </h2>
          
          {completedTrades.length > 0 ? (
            <div className="space-y-3">
              {completedTrades.map((trade) => (
                <div key={trade.id} className="bg-white/5 border border-white/10 rounded-xl p-4 opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-400/20 rounded-lg">
                        {getTypeIcon(trade.type)}
                      </div>
                      <div>
                        <div className="font-semibold capitalize">{trade.type}</div>
                        <div className="text-sm text-gray-400">
                          {trade.amount} {trade.fromToken}
                          {trade.toToken && ` → ${trade.toToken}`}
                          {trade.vault && ` (${trade.vault})`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-green-400 text-sm font-medium flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </div>
                      <div className="text-xs text-gray-400">
                        {trade.actualCompletion && formatTimeAgo(trade.actualCompletion)}
                        {trade.gasUsed && ` • ${trade.gasUsed} SEI gas`}
                      </div>
                    </div>
                  </div>
                  
                  {trade.txHash && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-xs text-gray-400">{trade.txHash}</div>
                        <button className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <div>No recent completed trades</div>
            </div>
          )}
        </div>

        {/* Empty State for Active Trades */}
        {activeTrades.length === 0 && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center mb-8">
            <Activity className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Active Trades</h3>
            <p className="text-gray-400 mb-4">All your trades have been completed successfully</p>
            <button
              onClick={() => window.location.href = '/portfolio/rebalance'}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all"
            >
              Start New Rebalance
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveTradesPage;