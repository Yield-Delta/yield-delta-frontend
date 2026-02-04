'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Activity,
  Brain,
  Clock,
  RefreshCw,
  Download,
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// ML API base URL - update for production
const ML_API_BASE = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000';

interface ModelMetrics {
  model_name: string;
  timestamp: string;
  recent_metrics: Array<{
    timestamp: string;
    mae?: number;
    mse?: number;
    rmse?: number;
    r2?: number;
  }>;
  performance_report: {
    model_name: string;
    report_timestamp: string;
    metrics_count: number;
    performance?: {
      mae?: { mean: number; std: number; min: number; max: number };
      mse?: { mean: number; std: number; min: number; max: number };
      r2?: { mean: number; std: number; min: number; max: number };
    };
    drift?: {
      is_drifting: boolean;
      severity: string;
      prediction_drift: number;
      performance_drift: number;
    };
  };
}

interface DriftStatus {
  model_name: string;
  timestamp: string;
  drift_metrics: {
    timestamp: string;
    feature_drift: Record<string, number>;
    prediction_drift: number;
    performance_drift: number;
    is_drifting: boolean;
    drift_severity: string;
  };
  alert: boolean;
  severity: string;
}

interface ModelStatus {
  model: string;
  is_loaded: boolean;
  version?: string;
  last_updated?: string;
  metrics?: Record<string, number>;
}

export default function MLMonitoringPage() {
  const [selectedModel, setSelectedModel] = useState<string>('rl_agent');
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [driftStatus, setDriftStatus] = useState<DriftStatus | null>(null);
  const [modelStatuses, setModelStatuses] = useState<ModelStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Model display names
  const modelNames: Record<string, string> = {
    rl_agent: 'RL Strategy Agent',
    lstm_forecaster: 'LSTM Price Forecaster',
    il_predictor: 'IL Risk Predictor'
  };

  // Fetch model statuses
  const fetchModelStatuses = async () => {
    try {
      const response = await fetch(`${ML_API_BASE}/api/models/status`);
      if (response.ok) {
        const data = await response.json();
        setModelStatuses(data);
      }
    } catch (error) {
      console.error('Error fetching model statuses:', error);
    }
  };

  // Fetch metrics for selected model
  const fetchMetrics = async (modelName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${ML_API_BASE}/api/monitoring/metrics/${modelName}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch drift status
  const fetchDriftStatus = async (modelName: string) => {
    try {
      const response = await fetch(`${ML_API_BASE}/api/monitoring/drift/${modelName}`);
      if (response.ok) {
        const data = await response.json();
        setDriftStatus(data);
      }
    } catch (error) {
      console.error('Error fetching drift status:', error);
    }
  };

  // Trigger model evaluation
  const triggerEvaluation = async (modelName: string) => {
    try {
      const response = await fetch(`${ML_API_BASE}/api/monitoring/evaluate/${modelName}`, {
        method: 'POST'
      });
      if (response.ok) {
        alert(`Evaluation started for ${modelNames[modelName]}`);
        // Refresh metrics after a delay
        setTimeout(() => fetchMetrics(modelName), 5000);
      }
    } catch (error) {
      console.error('Error triggering evaluation:', error);
    }
  };

  // Export report
  const exportReport = () => {
    if (!metrics) return;

    const report = {
      model: selectedModel,
      timestamp: new Date().toISOString(),
      metrics: metrics.performance_report,
      drift: driftStatus?.drift_metrics
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ml-report-${selectedModel}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchMetrics(selectedModel);
        fetchDriftStatus(selectedModel);
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, selectedModel, refreshInterval]);

  // Initial fetch
  useEffect(() => {
    fetchModelStatuses();
    fetchMetrics(selectedModel);
    fetchDriftStatus(selectedModel);
  }, [selectedModel]);

  // Prepare chart data
  const prepareChartData = () => {
    if (!metrics?.recent_metrics) return [];

    return metrics.recent_metrics.map((m, idx) => ({
      time: `T-${metrics.recent_metrics.length - idx - 1}`,
      mae: m.mae || 0,
      mse: m.mse || 0,
      r2: m.r2 || 0
    }));
  };

  // Drift severity colors
  const getDriftColor = (severity: string) => {
    switch (severity) {
      case 'none': return '#10b981';
      case 'low': return '#3b82f6';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ML Model Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time monitoring and drift detection for DeFi ML models
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refreshing' : 'Auto-Refresh'}
          </Button>
          <Button
            variant="outline"
            onClick={exportReport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Model Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modelStatuses.map((status) => (
          <Card
            key={status.model}
            className={`cursor-pointer transition-all ${
              selectedModel === status.model
                ? 'ring-2 ring-primary'
                : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedModel(status.model)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  {modelNames[status.model]}
                </CardTitle>
                {status.is_loaded ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    Inactive
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Version:</span>
                  <span className="font-medium">{status.version || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated:</span>
                  <span className="font-medium">
                    {status.last_updated
                      ? new Date(status.last_updated).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drift Alert */}
      {driftStatus?.alert && (
        <Alert
          className={`border-2 ${
            driftStatus.severity === 'high'
              ? 'border-red-500 bg-red-50 dark:bg-red-950'
              : driftStatus.severity === 'medium'
              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
              : 'border-blue-500 bg-blue-50 dark:bg-blue-950'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Model Drift Detected</AlertTitle>
          <AlertDescription>
            {modelNames[selectedModel]} is showing {driftStatus.severity} drift.
            Prediction drift: {(driftStatus.drift_metrics.prediction_drift * 100).toFixed(1)}%,
            Performance drift: {(driftStatus.drift_metrics.performance_drift * 100).toFixed(1)}%.
            Consider retraining or investigation.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="drift">Drift Analysis</TabsTrigger>
          <TabsTrigger value="predictions">Recent Predictions</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="mae"
                    stroke="#3b82f6"
                    name="MAE"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="mse"
                    stroke="#ef4444"
                    name="MSE"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="r2"
                    stroke="#10b981"
                    name="R² Score"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Statistics */}
          {metrics?.performance_report.performance && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">MAE Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mean:</span>
                      <span className="font-bold">
                        {metrics.performance_report.performance.mae?.mean.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Std Dev:</span>
                      <span>{metrics.performance_report.performance.mae?.std.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min/Max:</span>
                      <span>
                        {metrics.performance_report.performance.mae?.min.toFixed(4)} /{' '}
                        {metrics.performance_report.performance.mae?.max.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">MSE Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mean:</span>
                      <span className="font-bold">
                        {metrics.performance_report.performance.mse?.mean.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Std Dev:</span>
                      <span>{metrics.performance_report.performance.mse?.std.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min/Max:</span>
                      <span>
                        {metrics.performance_report.performance.mse?.min.toFixed(4)} /{' '}
                        {metrics.performance_report.performance.mse?.max.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">R² Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mean:</span>
                      <span className="font-bold">
                        {metrics.performance_report.performance.r2?.mean.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Std Dev:</span>
                      <span>{metrics.performance_report.performance.r2?.std.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min/Max:</span>
                      <span>
                        {metrics.performance_report.performance.r2?.min.toFixed(4)} /{' '}
                        {metrics.performance_report.performance.r2?.max.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Drift Analysis Tab */}
        <TabsContent value="drift" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Drift Detection Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Drift Severity Gauge */}
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-semibold mb-4">Overall Drift Severity</h3>
                  <div className="relative w-48 h-48">
                    <svg className="transform -rotate-90 w-48 h-48">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke={getDriftColor(driftStatus?.severity || 'none')}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${
                          (driftStatus?.drift_metrics.prediction_drift || 0) * 550
                        } 550`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold">
                          {driftStatus?.severity || 'None'}
                        </div>
                        <div className="text-sm text-gray-600">Drift Level</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drift Metrics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Drift Components</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Prediction Drift</span>
                        <span className="text-sm font-medium">
                          {((driftStatus?.drift_metrics.prediction_drift || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(driftStatus?.drift_metrics.prediction_drift || 0) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Performance Drift</span>
                        <span className="text-sm font-medium">
                          {((driftStatus?.drift_metrics.performance_drift || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(driftStatus?.drift_metrics.performance_drift || 0) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Feature Drift */}
                    {driftStatus?.drift_metrics.feature_drift &&
                      Object.entries(driftStatus.drift_metrics.feature_drift).slice(0, 3).map(
                        ([feature, value]) => (
                          <div key={feature}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm capitalize">
                                {feature.replace('_', ' ')}
                              </span>
                              <span className="text-sm font-medium">
                                {(value * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${value * 100}%` }}
                              />
                            </div>
                          </div>
                        )
                      )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Drift Alert History */}
          <Card>
            <CardHeader>
              <CardTitle>Drift Alert Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <div className="font-medium">Current Status</div>
                    <div className="text-sm text-gray-600">
                      {driftStatus?.drift_metrics.is_drifting
                        ? `Drift detected - ${driftStatus.severity} severity`
                        : 'No significant drift detected'}
                    </div>
                  </div>
                  <Badge
                    variant={driftStatus?.drift_metrics.is_drifting ? 'destructive' : 'default'}
                  >
                    {driftStatus?.drift_metrics.is_drifting ? 'Alert' : 'Normal'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Model Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.recent_metrics && metrics.recent_metrics.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-medium text-sm">
                    <div>Timestamp</div>
                    <div>MAE</div>
                    <div>MSE</div>
                    <div>RMSE</div>
                    <div>R² Score</div>
                  </div>
                  {metrics.recent_metrics.slice(-10).reverse().map((metric, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-5 gap-2 p-2 border-b text-sm hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <div className="text-gray-600">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </div>
                      <div>{metric.mae?.toFixed(4) || 'N/A'}</div>
                      <div>{metric.mse?.toFixed(4) || 'N/A'}</div>
                      <div>{metric.rmse?.toFixed(4) || 'N/A'}</div>
                      <div className="font-medium">
                        {metric.r2?.toFixed(4) || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent predictions available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Model Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-between"
                  onClick={() => triggerEvaluation(selectedModel)}
                >
                  <span>Run Evaluation</span>
                  <Activity className="h-4 w-4" />
                </Button>
                <Button
                  className="w-full justify-between"
                  variant="outline"
                  onClick={() => {
                    if (confirm('Are you sure you want to retrain this model?')) {
                      fetch(`${ML_API_BASE}/api/train`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model_type: selectedModel })
                      });
                    }
                  }}
                >
                  <span>Retrain Model</span>
                  <Brain className="h-4 w-4" />
                </Button>
                <Button
                  className="w-full justify-between"
                  variant="outline"
                  onClick={() => {
                    fetchMetrics(selectedModel);
                    fetchDriftStatus(selectedModel);
                  }}
                >
                  <span>Refresh Metrics</span>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monitoring Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Drift Threshold</span>
                  <Badge>0.1</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Window Size</span>
                  <Badge>1000</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cache TTL</span>
                  <Badge>24h</Badge>
                </div>
                <Button className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}