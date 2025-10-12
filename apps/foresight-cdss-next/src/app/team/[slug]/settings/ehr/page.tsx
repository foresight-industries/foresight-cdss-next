'use client';

import { useState, useEffect } from 'react';
import { Plus, Settings, Play, Trash2, AlertTriangle, CheckCircle, Clock, Globe, Database, Key } from 'lucide-react';
import { Card, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import type {
  EhrConnectionWithSystem,
  EhrSystem,
  EnvironmentType,
  ConnectionStatus,
  EhrAuthMethod,
  AuthConfig,
  SyncConfig,
  ConnectionStats,
  TestConnectionResult
} from '@/types/ehr-connection.types';

const ENVIRONMENT_OPTIONS: { value: EnvironmentType; label: string; description: string }[] = [
  { value: 'production', label: 'Production', description: 'Live production environment' },
  { value: 'staging', label: 'Staging', description: 'Staging/pre-production environment' },
  { value: 'development', label: 'Development', description: 'Development environment' },
  { value: 'testing', label: 'Testing', description: 'Testing environment' },
  { value: 'sandbox', label: 'Sandbox', description: 'EHR vendor sandbox' }
];

const AUTH_METHOD_OPTIONS: { value: EhrAuthMethod; label: string }[] = [
  { value: 'oauth2', label: 'OAuth 2.0' },
  { value: 'api_key', label: 'API Key' },
  { value: 'smart_on_fhir', label: 'SMART on FHIR' },
  { value: 'custom', label: 'Custom Auth' }
];

// const SYNC_FREQUENCY_OPTIONS = [
//   { value: 'manual', label: 'Manual Only' },
//   { value: 'hourly', label: 'Every Hour' },
//   { value: 'daily', label: 'Daily' },
//   { value: 'weekly', label: 'Weekly' },
//   { value: 'real-time', label: 'Real-time' }
// ];

export default function EhrConnectionsPage() {
  const [connections, setConnections] = useState<EhrConnectionWithSystem[]>([]);
  const [ehrSystems, setEhrSystems] = useState<EhrSystem[]>([]);
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  // const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<EhrConnectionWithSystem | null>(null);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [testing, setTesting] = useState(false);

  // Form states
  const [connectionForm, setConnectionForm] = useState({
    ehr_system_id: '',
    connection_name: '',
    environment: 'production' as EnvironmentType,
    base_url: '',
    auth_config: {
      method: 'oauth2' as EhrAuthMethod,
      client_id: '',
      client_secret: '',
      api_key: '',
      oauth_settings: {
        authorization_url: '',
        token_url: '',
        scopes: [] as string[],
        redirect_uri: ''
      }
    } as AuthConfig,
    sync_config: {
      enabled: false,
      frequency: 'daily' as any,
      entity_types: ['Patient', 'Encounter'],
      batch_size: 100,
      concurrent_requests: 5,
      timeout_seconds: 30
    } as SyncConfig,
    custom_headers: {} as Record<string, string>,
    metadata: {} as Record<string, any>
  });

  const [scopesInput, setScopesInput] = useState('');
  const [headersInput, setHeadersInput] = useState('');
  const [metadataInput, setMetadataInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load connections
      const connectionsResponse = await fetch('/api/ehr/connections');
      if (!connectionsResponse.ok) throw new Error('Failed to load connections');
      const connectionsData = await connectionsResponse.json();

      setConnections(connectionsData.connections);
      setStats(connectionsData.stats);

      // Load EHR systems
      try {
        const systemsResponse = await fetch('/api/ehr/systems');
        if (systemsResponse.ok) {
          const systemsData = await systemsResponse.json();
          if (systemsData.ehr_systems && systemsData.ehr_systems.length > 0) {
            setEhrSystems(systemsData.ehr_systems);
          }
        }
      } catch (systemsError) {
        // Network error or API endpoint doesn't exist, use defaults
        console.warn('EHR systems API error:', systemsError);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnection = async () => {
    try {
      // Parse JSON inputs
      const scopes = scopesInput ? scopesInput.split(',').map(s => s.trim()).filter(Boolean) : [];
      const customHeaders = headersInput ? JSON.parse(headersInput) : {};
      const metadata = metadataInput ? JSON.parse(metadataInput) : {};

      const formData = {
        ...connectionForm,
        auth_config: {
          ...connectionForm.auth_config,
          oauth_settings: {
            ...connectionForm.auth_config.oauth_settings,
            scopes
          }
        },
        custom_headers: customHeaders,
        metadata
      };

      const response = await fetch('/api/ehr/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create connection');
      }

      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create connection');
    }
  };

  const handleDeleteConnection = async (connection: EhrConnectionWithSystem) => {
    if (!confirm(`Are you sure you want to delete the connection "${connection.connection_name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ehr/connections/${connection.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete connection');
      }

      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete connection');
    }
  };

  const handleTestConnection = async (connection: EhrConnectionWithSystem) => {
    setSelectedConnection(connection);
    setTesting(true);
    setTestResult(null);
    setShowTestDialog(true);

    try {
      const response = await fetch(`/api/ehr/connections/${connection.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_type: 'comprehensive' })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to test connection');
      }

      const data = await response.json();
      setTestResult(data.test_result);
      loadData(); // Refresh to get updated status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test connection');
    } finally {
      setTesting(false);
    }
  };

  const resetForm = () => {
    setConnectionForm({
      ehr_system_id: '',
      connection_name: '',
      environment: 'production',
      base_url: '',
      auth_config: {
        method: 'oauth2',
        client_id: '',
        client_secret: '',
        api_key: '',
        oauth_settings: { scopes: [] }
      },
      sync_config: {
        enabled: false,
        frequency: 'daily',
        entity_types: ['Patient', 'Encounter'],
        batch_size: 100,
        concurrent_requests: 5,
        timeout_seconds: 30
      },
      custom_headers: {},
      metadata: {}
    });
    setScopesInput('');
    setHeadersInput('{}');
    setMetadataInput('{}');
  };

  const getStatusColor = (status?: ConnectionStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'testing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status?: ConnectionStatus) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'testing': return <Clock className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'maintenance': return <Settings className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getEnvironmentColor = (environment?: EnvironmentType) => {
    switch (environment) {
      case 'production': return 'bg-green-100 text-green-800';
      case 'staging': return 'bg-yellow-100 text-yellow-800';
      case 'development': return 'bg-blue-100 text-blue-800';
      case 'testing': return 'bg-purple-100 text-purple-800';
      case 'sandbox': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            EHR Integration Configuration
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage Electronic Health Record system integrations and connections
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Connection
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <CardDescription>{error}</CardDescription>
        </Alert>
      )}

      {/* EHR Status Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Connections</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total_connections}</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active_connections}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Environments</p>
                <p className="text-2xl font-bold text-purple-600">{Object.keys(stats.by_environment).length}</p>
              </div>
              <Globe className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Recent Failures</p>
                <p className="text-2xl font-bold text-red-600">{stats.recent_sync_failures}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </Card>
        </div>
      )}

      {/* EHR Connection Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              EHR Connections
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage your Electronic Health Record system connections and monitor their status
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400">Loading EHR connections...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 mb-4">No EHR connections configured</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Connection
              </Button>
            </div>
          ) : (
            connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${connection.status === 'active' ? "bg-green-500" : connection.status === 'error' ? "bg-red-500" : "bg-gray-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {connection.connection_name}
                      </p>
                      <Badge className={getStatusColor(connection.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(connection.status)}
                          <span>{connection.status || 'inactive'}</span>
                        </div>
                      </Badge>
                      <Badge className={getEnvironmentColor(connection.environment)}>
                        {connection.environment || 'production'}
                      </Badge>
                      {connection.ehr_system && (
                        <Badge variant="outline">
                          {connection.ehr_system.display_name || connection.ehr_system.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      {connection.base_url && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          {connection.base_url}
                        </span>
                      )}
                      {connection.auth_config && (
                        <span className="flex items-center gap-1">
                          <Key className="h-4 w-4" />
                          {(connection.auth_config as AuthConfig).method}
                        </span>
                      )}
                      {connection.health?.last_sync_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Last sync: {new Date(connection.health.last_sync_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {connection.last_error && (
                      <div className="mt-2 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{connection.last_error}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(connection)}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteConnection(connection)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Create Connection Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create EHR Connection</DialogTitle>
            <DialogDescription>
              Configure your Electronic Health Record system integration settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ehr_system">EHR System</Label>
                <Select
                  value={connectionForm.ehr_system_id}
                  onValueChange={(value) => setConnectionForm({ ...connectionForm, ehr_system_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select EHR system" />
                  </SelectTrigger>
                  <SelectContent>
                    {ehrSystems.map((system) => (
                      <SelectItem key={system.id} value={system.id}>
                        {system.display_name || system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="connection_name">Connection Name</Label>
                <Input
                  id="connection_name"
                  placeholder="Production Epic Connection"
                  value={connectionForm.connection_name}
                  onChange={(e) => setConnectionForm({ ...connectionForm, connection_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="environment">Environment</Label>
                <Select
                  value={connectionForm.environment}
                  onValueChange={(value) => setConnectionForm({ ...connectionForm, environment: value as EnvironmentType })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENVIRONMENT_OPTIONS.map((env) => (
                      <SelectItem key={env.value} value={env.value}>
                        {env.label} - {env.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="base_url">Base URL</Label>
                <Input
                  id="base_url"
                  placeholder="https://fhir.example.com/R4"
                  value={connectionForm.base_url}
                  onChange={(e) => setConnectionForm({ ...connectionForm, base_url: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="auth_method">Authentication Method</Label>
              <Select
                value={connectionForm.auth_config.method}
                onValueChange={(value) => setConnectionForm({
                  ...connectionForm,
                  auth_config: { ...connectionForm.auth_config, method: value as EhrAuthMethod }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTH_METHOD_OPTIONS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {connectionForm.auth_config.method === 'oauth2' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_id">Client ID</Label>
                    <Input
                      id="client_id"
                      value={connectionForm.auth_config.client_id || ''}
                      onChange={(e) => setConnectionForm({
                        ...connectionForm,
                        auth_config: { ...connectionForm.auth_config, client_id: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_secret">Client Secret</Label>
                    <Input
                      id="client_secret"
                      type="password"
                      value={connectionForm.auth_config.client_secret || ''}
                      onChange={(e) => setConnectionForm({
                        ...connectionForm,
                        auth_config: { ...connectionForm.auth_config, client_secret: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>
            )}

            {connectionForm.auth_config.method === 'api_key' && (
              <div>
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={connectionForm.auth_config.api_key || ''}
                  onChange={(e) => setConnectionForm({
                    ...connectionForm,
                    auth_config: { ...connectionForm.auth_config, api_key: e.target.value }
                  })}
                />
              </div>
            )}
            {connectionForm.auth_config.method === 'smart_on_fhir' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="smart_client_id">Client ID</Label>
                  <Input
                    id="smart_client_id"
                    value={connectionForm.auth_config.client_id || ''}
                    onChange={(e) => setConnectionForm({
                      ...connectionForm,
                      auth_config: { ...connectionForm.auth_config, client_id: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="well_known_url">Well-Known URL</Label>
                  <Input
                    id="well_known_url"
                    placeholder="https://fhir.example.com/.well-known/smart_configuration"
                    value={connectionForm.auth_config.smart_on_fhir_settings?.well_known_url || ''}
                    onChange={(e) => setConnectionForm({
                      ...connectionForm,
                      auth_config: {
                        ...connectionForm.auth_config,
                        smart_on_fhir_settings: {
                          ...connectionForm.auth_config.smart_on_fhir_settings,
                          well_known_url: e.target.value
                        }
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="launch_url">Launch URL (Optional)</Label>
                  <Input
                    id="launch_url"
                    placeholder="https://fhir.example.com/smart/launch"
                    value={connectionForm.auth_config.smart_on_fhir_settings?.launch_url || ''}
                    onChange={(e) => setConnectionForm({
                      ...connectionForm,
                      auth_config: {
                        ...connectionForm.auth_config,
                        smart_on_fhir_settings: {
                          ...connectionForm.auth_config.smart_on_fhir_settings,
                          launch_url: e.target.value
                        }
                      }
                    })}
                  />
                </div>
              </div>
            )}
            {connectionForm.auth_config.method === 'custom' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Custom Authentication Configuration</h4>
                  <p className="text-sm text-blue-800">
                    Configure custom authentication parameters for your EHR system.
                    Add key-value pairs for headers, credentials, or other authentication requirements.
                  </p>
                </div>
                <div>
                  <Label htmlFor="custom_auth_type">Authentication Type</Label>
                  <Select
                    value={connectionForm.auth_config.custom_auth?.auth_type || 'bearer_token'}
                    onValueChange={(value) => setConnectionForm({
                      ...connectionForm,
                      auth_config: {
                        ...connectionForm.auth_config,
                        custom_auth: {
                          ...connectionForm.auth_config.custom_auth,
                          auth_type: value
                        }
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bearer_token">Bearer Token</SelectItem>
                      <SelectItem value="basic_auth">Basic Authentication</SelectItem>
                      <SelectItem value="custom_header">Custom Header</SelectItem>
                      <SelectItem value="certificate">Client Certificate</SelectItem>
                      <SelectItem value="signature">Request Signing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {connectionForm.auth_config.custom_auth?.auth_type === 'bearer_token' && (
                  <div>
                    <Label htmlFor="bearer_token">Bearer Token</Label>
                    <Input
                      id="bearer_token"
                      type="password"
                      placeholder="Enter your bearer token"
                      value={connectionForm.auth_config.custom_auth?.bearer_token || ''}
                      onChange={(e) => setConnectionForm({
                        ...connectionForm,
                        auth_config: {
                          ...connectionForm.auth_config,
                          custom_auth: {
                            ...connectionForm.auth_config.custom_auth,
                            bearer_token: e.target.value
                          }
                        }
                      })}
                    />
                  </div>
                )}

                {connectionForm.auth_config.custom_auth?.auth_type === 'basic_auth' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="basic_username">Username</Label>
                      <Input
                        id="basic_username"
                        value={connectionForm.auth_config.custom_auth?.username || ''}
                        onChange={(e) => setConnectionForm({
                          ...connectionForm,
                          auth_config: {
                            ...connectionForm.auth_config,
                            custom_auth: {
                              ...connectionForm.auth_config.custom_auth,
                              username: e.target.value
                            }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="basic_password">Password</Label>
                      <Input
                        id="basic_password"
                        type="password"
                        value={connectionForm.auth_config.custom_auth?.password || ''}
                        onChange={(e) => setConnectionForm({
                          ...connectionForm,
                          auth_config: {
                            ...connectionForm.auth_config,
                            custom_auth: {
                              ...connectionForm.auth_config.custom_auth,
                              password: e.target.value
                            }
                          }
                        })}
                      />
                    </div>
                  </div>
                )}

                {connectionForm.auth_config.custom_auth?.auth_type === 'custom_header' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="header_name">Header Name</Label>
                      <Input
                        id="header_name"
                        placeholder="X-API-Key"
                        value={connectionForm.auth_config.custom_auth?.header_name || ''}
                        onChange={(e) => setConnectionForm({
                          ...connectionForm,
                          auth_config: {
                            ...connectionForm.auth_config,
                            custom_auth: {
                              ...connectionForm.auth_config.custom_auth,
                              header_name: e.target.value
                            }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="header_value">Header Value</Label>
                      <Input
                        id="header_value"
                        type="password"
                        placeholder="Your API key or token"
                        value={connectionForm.auth_config.custom_auth?.header_value || ''}
                        onChange={(e) => setConnectionForm({
                          ...connectionForm,
                          auth_config: {
                            ...connectionForm.auth_config,
                            custom_auth: {
                              ...connectionForm.auth_config.custom_auth,
                              header_value: e.target.value
                            }
                          }
                        })}
                      />
                    </div>
                  </div>
                )}

                {connectionForm.auth_config.custom_auth?.auth_type === 'certificate' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="certificate">Client Certificate (PEM)</Label>
                      <textarea
                        id="certificate"
                        className="w-full h-24 p-2 border rounded-md text-sm font-mono"
                        placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                        value={connectionForm.auth_config.custom_auth?.certificate || ''}
                        onChange={(e) => setConnectionForm({
                          ...connectionForm,
                          auth_config: {
                            ...connectionForm.auth_config,
                            custom_auth: {
                              ...connectionForm.auth_config.custom_auth,
                              certificate: e.target.value
                            }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="private_key">Private Key (PEM)</Label>
                      <textarea
                        id="private_key"
                        className="w-full h-24 p-2 border rounded-md text-sm font-mono"
                        placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                        value={connectionForm.auth_config.custom_auth?.private_key || ''}
                        onChange={(e) => setConnectionForm({
                          ...connectionForm,
                          auth_config: {
                            ...connectionForm.auth_config,
                            custom_auth: {
                              ...connectionForm.auth_config.custom_auth,
                              private_key: e.target.value
                            }
                          }
                        })}
                      />
                    </div>
                  </div>
                )}

                {connectionForm.auth_config.custom_auth?.auth_type === 'signature' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="signing_key">Signing Key</Label>
                      <Input
                        id="signing_key"
                        type="password"
                        placeholder="Your signing secret key"
                        value={connectionForm.auth_config.custom_auth?.signing_key || ''}
                        onChange={(e) => setConnectionForm({
                          ...connectionForm,
                          auth_config: {
                            ...connectionForm.auth_config,
                            custom_auth: {
                              ...connectionForm.auth_config.custom_auth,
                              signing_key: e.target.value
                            }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="signature_algorithm">Signature Algorithm</Label>
                      <Select
                        value={connectionForm.auth_config.custom_auth?.signature_algorithm || 'HMAC-SHA256'}
                        onValueChange={(value) => setConnectionForm({
                          ...connectionForm,
                          auth_config: {
                            ...connectionForm.auth_config,
                            custom_auth: {
                              ...connectionForm.auth_config.custom_auth,
                              signature_algorithm: value
                            }
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HMAC-SHA256">HMAC-SHA256</SelectItem>
                          <SelectItem value="HMAC-SHA512">HMAC-SHA512</SelectItem>
                          <SelectItem value="RSA-SHA256">RSA-SHA256</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="additional_params">Additional Parameters (JSON)</Label>
                  <textarea
                    id="additional_params"
                    className="w-full h-20 p-2 border rounded-md text-sm font-mono"
                    placeholder='{"custom_param": "value", "timeout": 30}'
                    value={connectionForm.auth_config.custom_auth?.additional_params ? JSON.stringify(connectionForm.auth_config.custom_auth.additional_params, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        const params = e.target.value ? JSON.parse(e.target.value) : {};
                        setConnectionForm({
                          ...connectionForm,
                          auth_config: {
                            ...connectionForm.auth_config,
                            custom_auth: {
                              ...connectionForm.auth_config.custom_auth,
                              additional_params: params
                            }
                          }
                        });
                      } catch (err) {
                        // Invalid JSON, ignore for now
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Add any additional authentication parameters as JSON
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateConnection}>
              Create Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Connection Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Connection Test Results</DialogTitle>
            <DialogDescription>
              {selectedConnection?.connection_name}
            </DialogDescription>
          </DialogHeader>

          {testing && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Testing connection...</span>
              </div>
              <Progress value={50} className="w-full" />
            </div>
          )}

          {testResult && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                <span className={testResult.success ? 'text-green-600' : 'text-red-600'}>
                  {testResult.success ? 'All Tests Passed' : 'Some Tests Failed'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded">
                  <p className="text-sm font-medium">Total Tests</p>
                  <p className="text-2xl font-bold">{testResult.summary.total_tests}</p>
                </div>
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded">
                  <p className="text-sm font-medium">Passed</p>
                  <p className="text-2xl font-bold text-green-600">{testResult.summary.passed_tests}</p>
                </div>
              </div>

              <div className="space-y-2">
                {Object.entries(testResult.tests).map(([testName, test]) => (
                  <div key={testName} className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded">
                    <div className="flex items-center space-x-2">
                      {test.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="capitalize">{testName.replace('_', ' ')}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{test.message}</p>
                      {test.duration_ms && (
                        <p className="text-xs text-gray-500">{test.duration_ms}ms</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {testResult.summary.warnings.length > 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Warnings:</h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    {testResult.summary.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowTestDialog(false)}>
              Close
            </Button>
            {selectedConnection && (
              <Button
                variant="outline"
                onClick={() => handleTestConnection(selectedConnection)}
                disabled={testing}
              >
                <Play className="w-4 h-4 mr-2" />
                Test Again
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
