'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Alert components removed - not used
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  Bell,
  Search,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  Mail,
  MessageSquare,
  Send
} from 'lucide-react';

interface MLAlert {
  id: string;
  timestamp: string;
  model_name: string;
  alert_type: 'drift' | 'performance' | 'error' | 'training';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metrics?: {
    prediction_drift?: number;
    performance_drift?: number;
    feature_drift?: Record<string, number>;
    error_rate?: number;
    latency?: number;
  };
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  actions_taken?: string[];
  notification_sent: boolean;
}

interface AlertStats {
  total: number;
  unresolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  by_model: Record<string, number>;
  by_type: Record<string, number>;
}

interface NotificationSettings {
  email: boolean;
  email_address: string;
  slack: boolean;
  slack_webhook: string;
  discord: boolean;
  discord_webhook: string;
  threshold_severity: 'low' | 'medium' | 'high' | 'critical';
  rate_limit: number; // minutes between notifications
}

export default function MLAlertsPage() {
  const [alerts, setAlerts] = useState<MLAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<MLAlert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<MLAlert | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterModel, setFilterModel] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    email_address: 'admin@yielddelta.com',
    slack: false,
    slack_webhook: '',
    discord: false,
    discord_webhook: '',
    threshold_severity: 'medium',
    rate_limit: 30
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Mock data - replace with real API calls
  useEffect(() => {
    // Generate mock alerts
    const mockAlerts: MLAlert[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        model_name: 'rl_agent',
        alert_type: 'drift',
        severity: 'high',
        title: 'High Model Drift Detected',
        description: 'RL Agent showing significant drift in prediction patterns',
        metrics: {
          prediction_drift: 0.35,
          performance_drift: 0.28,
          feature_drift: { feature_0: 0.31, feature_1: 0.29, feature_2: 0.18 }
        },
        resolved: false,
        notification_sent: true
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        model_name: 'lstm_forecaster',
        alert_type: 'performance',
        severity: 'medium',
        title: 'Performance Degradation',
        description: 'LSTM forecaster accuracy below threshold',
        metrics: {
          error_rate: 0.15,
          latency: 250
        },
        resolved: false,
        notification_sent: true
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        model_name: 'il_predictor',
        alert_type: 'error',
        severity: 'critical',
        title: 'Model Loading Error',
        description: 'Failed to load IL predictor model',
        resolved: true,
        resolved_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        resolved_by: 'auto-recovery',
        actions_taken: ['Reloaded model from backup', 'Cleared cache'],
        notification_sent: true
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        model_name: 'rl_agent',
        alert_type: 'training',
        severity: 'low',
        title: 'Training Completed',
        description: 'RL agent training finished successfully',
        metrics: {
          error_rate: 0.02
        },
        resolved: true,
        resolved_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        notification_sent: false
      }
    ];

    setAlerts(mockAlerts);
    calculateStats(mockAlerts);
  }, []);

  // Calculate alert statistics
  const calculateStats = (alertList: MLAlert[]) => {
    const stats: AlertStats = {
      total: alertList.length,
      unresolved: alertList.filter(a => !a.resolved).length,
      critical: alertList.filter(a => a.severity === 'critical').length,
      high: alertList.filter(a => a.severity === 'high').length,
      medium: alertList.filter(a => a.severity === 'medium').length,
      low: alertList.filter(a => a.severity === 'low').length,
      by_model: {},
      by_type: {}
    };

    alertList.forEach(alert => {
      // By model
      if (!stats.by_model[alert.model_name]) {
        stats.by_model[alert.model_name] = 0;
      }
      stats.by_model[alert.model_name]++;

      // By type
      if (!stats.by_type[alert.alert_type]) {
        stats.by_type[alert.alert_type] = 0;
      }
      stats.by_type[alert.alert_type]++;
    });

    setStats(stats);
  };

  // Filter alerts
  useEffect(() => {
    let filtered = [...alerts];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        a =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.model_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Severity filter
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(a => a.severity === filterSeverity);
    }

    // Model filter
    if (filterModel !== 'all') {
      filtered = filtered.filter(a => a.model_name === filterModel);
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(a => a.alert_type === filterType);
    }

    // Resolved filter
    if (!showResolved) {
      filtered = filtered.filter(a => !a.resolved);
    }

    setFilteredAlerts(filtered);
  }, [alerts, searchQuery, filterSeverity, filterModel, filterType, showResolved]);

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get alert icon
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'drift': return <TrendingUp className="h-4 w-4" />;
      case 'performance': return <Activity className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'training': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Mark alert as resolved
  const resolveAlert = (alertId: string, action?: string) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === alertId
          ? {
              ...a,
              resolved: true,
              resolved_at: new Date().toISOString(),
              resolved_by: 'admin',
              actions_taken: action ? [...(a.actions_taken || []), action] : a.actions_taken
            }
          : a
      )
    );
  };

  // Delete alert
  const deleteAlert = (alertId: string) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    }
  };

  // Send test notification
  const sendTestNotification = () => {
    alert('Test notification sent to configured channels');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ML System Alerts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage machine learning model alerts
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </Button>
          <Button
            onClick={sendTestNotification}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Test Alert
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Alerts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.unresolved}</div>
              <div className="text-sm text-gray-600">Unresolved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <div className="text-sm text-gray-600">Critical</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-500">{stats.high}</div>
              <div className="text-sm text-gray-600">High</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-500">{stats.medium}</div>
              <div className="text-sm text-gray-600">Medium</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-500">{stats.low}</div>
              <div className="text-sm text-gray-600">Low</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterModel} onValueChange={setFilterModel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                <SelectItem value="rl_agent">RL Agent</SelectItem>
                <SelectItem value="lstm_forecaster">LSTM Forecaster</SelectItem>
                <SelectItem value="il_predictor">IL Predictor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="drift">Drift</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="training">Training</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showResolved ? 'default' : 'outline'}
              onClick={() => setShowResolved(!showResolved)}
              className="flex items-center gap-2"
            >
              {showResolved ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showResolved ? 'Hide' : 'Show'} Resolved
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alert History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Alert</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map(alert => (
                <TableRow key={alert.id} className={alert.resolved ? 'opacity-60' : ''}>
                  <TableCell>
                    {alert.resolved ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(alert.timestamp).toLocaleDateString()}</div>
                      <div className="text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{alert.model_name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getAlertIcon(alert.alert_type)}
                      <span className="capitalize">{alert.alert_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-gray-600">{alert.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!alert.resolved && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alert Details Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Alert ID</label>
                  <div className="font-medium">{selectedAlert.id}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Status</label>
                  <div>
                    <Badge variant={selectedAlert.resolved ? 'default' : 'destructive'}>
                      {selectedAlert.resolved ? 'Resolved' : 'Active'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Model</label>
                  <div className="font-medium">{selectedAlert.model_name}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Type</label>
                  <div className="font-medium capitalize">{selectedAlert.alert_type}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Severity</label>
                  <Badge className={getSeverityColor(selectedAlert.severity)}>
                    {selectedAlert.severity.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Timestamp</label>
                  <div className="font-medium">
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Description</label>
                <div className="font-medium mt-1">{selectedAlert.description}</div>
              </div>

              {selectedAlert.metrics && (
                <div>
                  <label className="text-sm text-gray-600">Metrics</label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <pre className="text-sm">
                      {JSON.stringify(selectedAlert.metrics, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedAlert.resolved && (
                <div className="space-y-2">
                  <div>
                    <label className="text-sm text-gray-600">Resolved At</label>
                    <div className="font-medium">
                      {new Date(selectedAlert.resolved_at!).toLocaleString()}
                    </div>
                  </div>
                  {selectedAlert.resolved_by && (
                    <div>
                      <label className="text-sm text-gray-600">Resolved By</label>
                      <div className="font-medium">{selectedAlert.resolved_by}</div>
                    </div>
                  )}
                  {selectedAlert.actions_taken && selectedAlert.actions_taken.length > 0 && (
                    <div>
                      <label className="text-sm text-gray-600">Actions Taken</label>
                      <ul className="mt-1 list-disc list-inside">
                        {selectedAlert.actions_taken.map((action, idx) => (
                          <li key={idx} className="text-sm">{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!selectedAlert.resolved && (
                <div className="flex gap-2">
                  <Button onClick={() => {
                    resolveAlert(selectedAlert.id, 'Manual investigation completed');
                    setSelectedAlert(null);
                  }}>
                    Mark as Resolved
                  </Button>
                  <Button variant="outline">
                    Trigger Model Retrain
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notification Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>
              Configure how you receive alerts from the ML monitoring system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>Email Notifications</span>
              </div>
              <Button
                variant={notificationSettings.email ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setNotificationSettings(prev => ({ ...prev, email: !prev.email }))
                }
              >
                {notificationSettings.email ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            {notificationSettings.email && (
              <Input
                placeholder="admin@example.com"
                value={notificationSettings.email_address}
                onChange={(e) =>
                  setNotificationSettings(prev => ({
                    ...prev,
                    email_address: e.target.value
                  }))
                }
              />
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Slack Notifications</span>
              </div>
              <Button
                variant={notificationSettings.slack ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setNotificationSettings(prev => ({ ...prev, slack: !prev.slack }))
                }
              >
                {notificationSettings.slack ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            {notificationSettings.slack && (
              <Input
                placeholder="https://hooks.slack.com/services/..."
                value={notificationSettings.slack_webhook}
                onChange={(e) =>
                  setNotificationSettings(prev => ({
                    ...prev,
                    slack_webhook: e.target.value
                  }))
                }
              />
            )}

            <div>
              <label className="text-sm text-gray-600">Minimum Severity</label>
              <Select
                value={notificationSettings.threshold_severity}
                onValueChange={(value: string) =>
                  setNotificationSettings(prev => ({
                    ...prev,
                    threshold_severity: value as 'low' | 'medium' | 'high' | 'critical'
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low and above</SelectItem>
                  <SelectItem value="medium">Medium and above</SelectItem>
                  <SelectItem value="high">High and above</SelectItem>
                  <SelectItem value="critical">Critical only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Rate Limit (minutes between notifications)
              </label>
              <Input
                type="number"
                value={notificationSettings.rate_limit}
                onChange={(e) =>
                  setNotificationSettings(prev => ({
                    ...prev,
                    rate_limit: parseInt(e.target.value)
                  }))
                }
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => {
                // Save settings
                alert('Settings saved');
                setSettingsOpen(false);
              }}>
                Save Settings
              </Button>
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}