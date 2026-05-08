'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Layers,
  PenTool,
  Bell,
  ChevronDown,
  Check,
  X,
  RefreshCw,
  Activity,
  Zap,
  TrendingUp,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Indicator {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
  period?: number;
}

interface ControlSidebarProps {
  selectedTimeframe: string;
  setSelectedTimeframe: (tf: string) => void;
  indicators: Indicator[];
  setIndicators: React.Dispatch<React.SetStateAction<Indicator[]>>;
  showRSI: boolean;
  setShowRSI: (show: boolean) => void;
  showMACD: boolean;
  setShowMACD: (show: boolean) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

const TIMEFRAMES = [
  { label: '1m', value: '1m', days: 1 },
  { label: '5m', value: '5m', days: 5 },
  { label: '15m', value: '15m', days: 15 },
  { label: '1H', value: '1h', days: 30 },
  { label: '4H', value: '4h', days: 90 },
  { label: '1D', value: '1d', days: 180 },
  { label: '1W', value: '1w', days: 365 },
];

const DEFAULT_INDICATORS: Indicator[] = [
  { id: 'sma20', name: 'SMA 20', enabled: true, color: '#06b6d4', period: 20 },
  { id: 'sma50', name: 'SMA 50', enabled: true, color: '#8b5cf6', period: 50 },
  { id: 'sma200', name: 'SMA 200', enabled: false, color: '#f59e0b', period: 200 },
  { id: 'ema12', name: 'EMA 12', enabled: false, color: '#f472b6', period: 12 },
  { id: 'ema26', name: 'EMA 26', enabled: false, color: '#ec4899', period: 26 },
  { id: 'bollinger', name: 'Bollinger Bands', enabled: true, color: '#10b981' },
  { id: 'volume', name: 'Volume', enabled: true, color: '#6366f1' },
];

export default function ControlSidebar({
  selectedTimeframe,
  setSelectedTimeframe,
  indicators,
  setIndicators,
  showRSI,
  setShowRSI,
  showMACD,
  setShowMACD,
  onRefresh,
  isLoading,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}: ControlSidebarProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('timeframe');

  const toggleIndicator = useCallback((id: string) => {
    setIndicators(prev => prev.map(ind =>
      ind.id === id ? { ...ind, enabled: !ind.enabled } : ind
    ));
  }, [setIndicators]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  if (isCollapsed) {
    return (
      <motion.div
        className={`w-14 h-full rounded-xl flex flex-col items-center py-4 gap-4 ${className}`}
        style={{
          background: 'rgba(10, 10, 15, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400"
        >
          <ChevronDown className="w-5 h-5 rotate-90" />
        </button>

        {[
          { icon: Clock, section: 'timeframe' },
          { icon: Layers, section: 'indicators' },
          { icon: Activity, section: 'charts' },
          { icon: Bell, section: 'alerts' },
        ].map(({ icon: Icon, section }) => (
          <button
            key={section}
            onClick={() => toggleSection(section)}
            className={`p-2 rounded-lg transition-colors ${
              expandedSection === section ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`h-full rounded-xl flex flex-col overflow-hidden ${className}`}
      style={{
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 0 40px rgba(0, 245, 212, 0.05), inset 0 0 60px rgba(0, 0, 0, 0.2)',
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="font-semibold text-white text-sm">Chart Controls</h3>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Timeframe Section */}
        <Section
          title="Timeframe"
          icon={Clock}
          isExpanded={expandedSection === 'timeframe'}
          onToggle={() => toggleSection('timeframe')}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                onClick={() => setSelectedTimeframe(tf.value)}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                  selectedTimeframe === tf.value
                    ? 'bg-primary/20 text-primary border border-primary/50 shadow-lg shadow-primary/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Indicators Section */}
        <Section
          title="Indicators"
          icon={Layers}
          isExpanded={expandedSection === 'indicators'}
          onToggle={() => toggleSection('indicators')}
          badge={indicators.filter(i => i.enabled).length}
        >
          <div className="space-y-1.5">
            {indicators.map(indicator => (
              <button
                key={indicator.id}
                onClick={() => toggleIndicator(indicator.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  indicator.enabled
                    ? 'bg-white/5 border border-white/10'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
                style={indicator.enabled ? { borderColor: `${indicator.color}30` } : {}}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full transition-all"
                  style={{
                    background: indicator.enabled ? indicator.color : 'rgba(255, 255, 255, 0.2)',
                    boxShadow: indicator.enabled ? `0 0 8px ${indicator.color}` : 'none',
                  }}
                />
                <span className={`flex-1 text-left text-xs ${
                  indicator.enabled ? 'text-white' : 'text-gray-500'
                }`}>
                  {indicator.name}
                </span>
                {indicator.period && (
                  <span className="text-[10px] text-gray-500">{indicator.period}</span>
                )}
                {indicator.enabled && (
                  <Check className="w-3.5 h-3.5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </Section>

        {/* Chart Toggles Section */}
        <Section
          title="Chart Panels"
          icon={Eye}
          isExpanded={expandedSection === 'charts'}
          onToggle={() => toggleSection('charts')}
        >
          <div className="space-y-1.5">
            <ToggleButton
              label="RSI Indicator"
              sublabel="Relative Strength Index"
              icon={Activity}
              enabled={showRSI}
              onClick={() => setShowRSI(!showRSI)}
              color="#8b5cf6"
            />
            <ToggleButton
              label="MACD Indicator"
              sublabel="Moving Average Convergence"
              icon={Zap}
              enabled={showMACD}
              onClick={() => setShowMACD(!showMACD)}
              color="#06b6d4"
            />
          </div>
        </Section>

        {/* Drawing Tools Section */}
        <Section
          title="Drawing Tools"
          icon={PenTool}
          isExpanded={expandedSection === 'draw'}
          onToggle={() => toggleSection('draw')}
        >
          <p className="text-xs text-gray-500 mb-2">Use the floating toolbar on the chart to draw</p>
          <div className="grid grid-cols-2 gap-1.5">
            {['Line', 'H-Line', 'Fib', 'Rect'].map(tool => (
              <button
                key={tool}
                className="px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
              >
                {tool}
              </button>
            ))}
          </div>
        </Section>

        {/* Alerts Section */}
        <Section
          title="Price Alerts"
          icon={Bell}
          isExpanded={expandedSection === 'alerts'}
          onToggle={() => toggleSection('alerts')}
        >
          <div className="text-center py-4 text-gray-500 text-xs">
            <Bell className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p>No active alerts</p>
            <button className="mt-2 text-primary hover:underline">+ Add Alert</button>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/10">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-sm">Refresh Data</span>
        </button>
      </div>
    </motion.div>
  );
}

// Section component
interface SectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: number;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, isExpanded, onToggle, badge, children }: SectionProps) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:text-white transition-colors"
      >
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="flex-1 text-left font-medium">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
            {badge}
          </span>
        )}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Toggle button component
interface ToggleButtonProps {
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  enabled: boolean;
  onClick: () => void;
  color: string;
}

function ToggleButton({ label, sublabel, icon: Icon, enabled, onClick, color }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
        enabled
          ? 'bg-white/5 border'
          : 'text-gray-400 hover:text-white border border-transparent'
      }`}
      style={enabled ? { borderColor: `${color}30` } : {}}
    >
      <Icon className="w-4 h-4" style={{ color: enabled ? color : undefined }} />
      <div className="flex-1 text-left">
        <div className="text-xs font-medium">{label}</div>
        {sublabel && <div className="text-[10px] text-gray-500">{sublabel}</div>}
      </div>
      <div
        className="w-8 h-4 rounded-full relative transition-all"
        style={{
          background: enabled ? color : 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all"
          style={{
            left: enabled ? 'calc(100% - 14px)' : '2px',
          }}
        />
      </div>
    </button>
  );
}

// Export default state for sidebar
export function useChartControls() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [indicators, setIndicators] = useState<Indicator[]>(DEFAULT_INDICATORS);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return {
    selectedTimeframe,
    setSelectedTimeframe,
    indicators,
    setIndicators,
    showRSI,
    setShowRSI,
    showMACD,
    setShowMACD,
    isCollapsed,
    setIsCollapsed,
    toggleCollapse: () => setIsCollapsed(prev => !prev),
  };
}