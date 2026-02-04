'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Brain,
  Activity,
  AlertCircle,
  Clock,
  Database,
  ChevronRight,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ML_API_BASE = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000';

interface SystemStats {
  models_loaded: number;
  total_predictions: number;
  avg_latency: number;
  error_rate: number;
  cache_hit_rate: number;
  redis_connected: boolean;
}

interface ModelOverview {
  name: string;
  status: 'active' | 'inactive' | 'error';
  last_prediction: string;
  predictions_24h: number;
  avg_latency: number;
  error_rate: number;
}

interface RecentAlert {
  id: string;
  model: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [systemStats, setSystemStats] = useState<SystemStats>({ // eslint-disable-line @typescript-eslint/no-unused-vars
    models_loaded: 3,
    total_predictions: 1247,
    avg_latency: 145,
    error_rate: 0.02,
    cache_hit_rate: 0.85,
    redis_connected: true
  });

  const [models, setModels] = useState<ModelOverview[]>([ // eslint-disable-line @typescript-eslint/no-unused-vars
    {
      name: 'RL Strategy Agent',
      status: 'active',
      last_prediction: '2 min ago',
      predictions_24h: 432,
      avg_latency: 120,
      error_rate: 0.01
    },
    {
      name: 'LSTM Forecaster',
      status: 'active',
      last_prediction: '5 min ago',
      predictions_24h: 567,
      avg_latency: 180,
      error_rate: 0.03
    },
    {
      name: 'IL Predictor',
      status: 'active',
      last_prediction: '1 min ago',
      predictions_24h: 248,
      avg_latency: 135,
      error_rate: 0.02
    }
  ]);

  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([ // eslint-disable-line @typescript-eslint/no-unused-vars
    {
      id: '1',
      model: 'lstm_forecaster',
      severity: 'medium',
      message: 'Performance degradation detected',
      timestamp: '10 min ago'
    },
    {
      id: '2',
      model: 'rl_agent',
      severity: 'low',
      message: 'Training completed successfully',
      timestamp: '1 hour ago'
    }
  ]);

  // Mock performance data
  const performanceData = [
    { time: '00:00', predictions: 45, latency: 120 },
    { time: '04:00', predictions: 38, latency: 115 },
    { time: '08:00', predictions: 67, latency: 145 },
    { time: '12:00', predictions: 89, latency: 160 },
    { time: '16:00', predictions: 76, latency: 155 },
    { time: '20:00', predictions: 54, latency: 130 }
  ];

  // Resource usage data
  const resourceData = [
    { name: 'CPU', value: 45, max: 100 },
    { name: 'Memory', value: 3.2, max: 8 },
    { name: 'GPU', value: 60, max: 100 },
    { name: 'Storage', value: 12, max: 50 }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            ML System Overview and Management
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh All
        </Button>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Models</p>
                <p className="text-2xl font-bold">{systemStats.models_loaded}/3</p>
              </div>
              <Brain className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Predictions 24h</p>
                <p className="text-2xl font-bold">{systemStats.total_predictions}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Latency</p>
                <p className="text-2xl font-bold">{systemStats.avg_latency}ms</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold">{(systemStats.error_rate * 100).toFixed(1)}%</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cache Hit</p>
                <p className="text-2xl font-bold">{(systemStats.cache_hit_rate * 100).toFixed(0)}%</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Redis</p>
                <div className="flex items-center gap-2 mt-1">
                  {systemStats.redis_connected ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-bold">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="font-bold">Offline</span>
                    </>
                  )}
                </div>
              </div>
              <Database className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Model Status</CardTitle>
              <Link href="/admin/models">
                <Button variant="ghost" size="sm">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {models.map((model) => (
                <div key={model.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Brain className="h-10 w-10 text-primary" />
                      {model.status === 'active' ? (
                        <CheckCircle className="h-4 w-4 text-green-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{model.name}</p>
                      <p className="text-sm text-gray-600">Last: {model.last_prediction}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">24h Predictions</p>
                      <p className="font-bold">{model.predictions_24h}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Avg Latency</p>
                      <p className="font-bold">{model.avg_latency}ms</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Error Rate</p>
                      <p className="font-bold">{(model.error_rate * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Alerts</CardTitle>
              <Link href="/admin/ml-alerts">
                <Button variant="ghost" size="sm">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {alert.model}
                      </Badge>
                      <span className="text-xs text-gray-500">{alert.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
              {recentAlerts.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No recent alerts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Predictions Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Predictions & Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="predictions"
                  stroke="#3b82f6"
                  name="Predictions"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="latency"
                  stroke="#ef4444"
                  name="Latency (ms)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resourceData.map((resource) => (
                <div key={resource.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{resource.name}</span>
                    <span className="text-sm text-gray-600">
                      {resource.value}{resource.name === 'Memory' || resource.name === 'Storage' ? 'GB' : '%'} / {resource.max}{resource.name === 'Memory' || resource.name === 'Storage' ? 'GB' : '%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (resource.value / resource.max) > 0.8
                          ? 'bg-red-500'
                          : (resource.value / resource.max) > 0.6
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${(resource.value / resource.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/ml-monitoring">
              <Button variant="outline" className="w-full">
                <Activity className="h-4 w-4 mr-2" />
                View Monitoring
              </Button>
            </Link>
            <Link href="/admin/ml-alerts">
              <Button variant="outline" className="w-full">
                <AlertCircle className="h-4 w-4 mr-2" />
                Check Alerts
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (confirm('Start training all models?')) {
                  fetch(`${ML_API_BASE}/api/train`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model_type: 'all' })
                  });
                }
              }}
            >
              <Brain className="h-4 w-4 mr-2" />
              Train All Models
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(`${ML_API_BASE}/api/docs`, '_blank')}
            >
              <Database className="h-4 w-4 mr-2" />
              API Docs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}