"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Settings, 
  Trash2, 
  TestTube, 
  Globe, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Shield,
  Database,
  Zap,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import type { 
  EHRConnection, 
  EHRSystem, 
  CreateEHRConnectionRequest,
  EHRConnectionTestResult,
  EHRSystemTemplate
} from '@/types/ehr.types';
import { EHR_SYSTEM_TEMPLATES, getConnectionStatusColor, getConnectionStatusLabel } from '@/types/ehr.types';

export default function EHRSettingsPage() {
  const [connections, setConnections] = useState<EHRConnection[]>([]);
  const [ehrSystems, setEHRSystems] = useState<EHRSystem[]>([]);
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>('production');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [environment]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch connections and EHR systems in parallel
      const [connectionsResponse, systemsResponse] = await Promise.all([
        fetch(`/api/ehr/connections?environment=${environment}`),
        fetch('/api/ehr/systems')
      ]);

      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json();
        setConnections(connectionsData.connections || []);
      }

      if (systemsResponse.ok) {
        const systemsData = await systemsResponse.json();
        setEHRSystems(systemsData.ehr_systems || []);
      }

      setError(null);
    } catch (err) {
      setError('Failed to load EHR configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnection = async (formData: CreateEHRConnectionRequest) => {
    try {
      const response = await fetch('/api/ehr/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, environment })
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsCreateOpen(false);
        fetchData();
      } else {
        setError(data.error || 'Failed to create EHR connection');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleTestConnection = async (connectionId: string) => {
    try {
      setTestingConnectionId(connectionId);
      const response = await fetch(`/api/ehr/connections/${connectionId}/test`, {
        method: 'POST'
      });

      const data = await response.json();
      
      if (response.ok) {
        // Refresh connections to show updated status
        fetchData();
        
        // Show test results
        const result: EHRConnectionTestResult = data.test_result;
        const message = result.success 
          ? `✅ Connection test successful! Response time: ${result.response_time_ms}ms`
          : `❌ Connection test failed: ${result.error_message}`;
        alert(message);
      } else {
        setError(data.error || 'Failed to test connection');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setTestingConnectionId(null);
    }
  };

  const handleDeleteConnection = async (connectionId: string, connectionName: string) => {
    if (!confirm(`Are you sure you want to delete the connection "${connectionName}"?`)) return;

    try {
      const response = await fetch(`/api/ehr/connections/${connectionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete connection');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">EHR Integration</h1>
          <p className="text-muted-foreground">
            Configure and manage your Electronic Health Record system connections
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={environment} onValueChange={(value: 'development' | 'staging' | 'production') => setEnvironment(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="development">Development</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add EHR Connection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <CreateConnectionForm 
                ehrSystems={ehrSystems}
                environment={environment}
                onSubmit={handleCreateConnection} 
                onCancel={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={environment} className="w-full">
        <TabsList>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="staging">Staging</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
        </TabsList>

        <TabsContent value={environment} className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading EHR connections...</div>
          ) : connections.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No EHR connections configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your Electronic Health Record system to enable data synchronization
                  </p>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First EHR Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {connections.map((connection) => (
                <EHRConnectionCard 
                  key={connection.id}
                  connection={connection}
                  onTest={() => handleTestConnection(connection.id)}
                  onDelete={() => handleDeleteConnection(connection.id, connection.connection_name)}
                  isTesting={testingConnectionId === connection.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreateConnectionForm({ 
  ehrSystems, 
  environment, 
  onSubmit, 
  onCancel 
}: { 
  ehrSystems: EHRSystem[];
  environment: string;
  onSubmit: (data: CreateEHRConnectionRequest) => void; 
  onCancel: () => void; 
}) {
  const [step, setStep] = useState(1);
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<EHRSystemTemplate | null>(null);
  const [formData, setFormData] = useState<CreateEHRConnectionRequest>({
    ehr_system_id: '',
    connection_name: '',
    base_url: '',
    environment: environment as any,
    auth_config: { type: 'oauth2' },
    custom_headers: {},
    sync_config: {
      enabled: false,
      sync_frequency: 'manual',
      sync_entities: []
    }
  });
  const [showPassword, setShowPassword] = useState(false);

  const selectedSystem = ehrSystems.find(s => s.id === selectedSystemId);

  const handleSystemSelect = (systemId: string, template?: EHRSystemTemplate) => {
    setSelectedSystemId(systemId);
    setSelectedTemplate(template || null);
    
    const system = ehrSystems.find(s => s.id === systemId);
    if (system) {
      setFormData(prev => ({
        ...prev,
        ehr_system_id: systemId,
        auth_config: { type: system.auth_method },
        base_url: template && EHR_SYSTEM_TEMPLATES[template] 
          ? EHR_SYSTEM_TEMPLATES[template].default_endpoints[environment as keyof typeof EHR_SYSTEM_TEMPLATES[typeof template]['default_endpoints']] || ''
          : ''
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (step === 1) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Choose Your EHR System</DialogTitle>
          <DialogDescription>
            Select your Electronic Health Record system to configure the connection
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Popular EHR Systems */}
            {Object.entries(EHR_SYSTEM_TEMPLATES).map(([key, template]) => (
              <Card 
                key={key}
                className={`cursor-pointer transition-all ${selectedTemplate === key ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => {
                  // For templates, create a system entry or use existing one
                  const existingSystem = ehrSystems.find(s => s.name.toLowerCase() === template.name.toLowerCase());
                  if (existingSystem) {
                    handleSystemSelect(existingSystem.id, key as EHRSystemTemplate);
                  } else {
                    // For now, we'll use template data directly
                    setSelectedTemplate(key as EHRSystemTemplate);
                    setFormData(prev => ({
                      ...prev,
                      ehr_system_id: 'template_' + key, // Temporary ID for templates
                      auth_config: { type: template.auth_method },
                      base_url: template.default_endpoints[environment as keyof typeof template.default_endpoints] || ''
                    }));
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{template.display_name}</h3>
                      <p className="text-sm text-muted-foreground">{template.api_type.toUpperCase()} API</p>
                      <div className="flex gap-1 mt-2">
                        <Badge variant="outline" className="text-xs">{template.auth_method}</Badge>
                        {template.fhir_version && (
                          <Badge variant="outline" className="text-xs">FHIR {template.fhir_version}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {selectedTemplate === key && <CheckCircle className="h-5 w-5 text-primary" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Custom/Other Systems */}
            {ehrSystems.filter(system => 
              !Object.values(EHR_SYSTEM_TEMPLATES).some(template => 
                template.name.toLowerCase() === system.name.toLowerCase()
              )
            ).map((system) => (
              <Card 
                key={system.id}
                className={`cursor-pointer transition-all ${selectedSystemId === system.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => handleSystemSelect(system.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{system.display_name}</h3>
                      <p className="text-sm text-muted-foreground">{system.api_type.toUpperCase()} API</p>
                      <div className="flex gap-1 mt-2">
                        <Badge variant="outline" className="text-xs">{system.auth_method}</Badge>
                        {system.fhir_version && (
                          <Badge variant="outline" className="text-xs">FHIR {system.fhir_version}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {selectedSystemId === system.id && <CheckCircle className="h-5 w-5 text-primary" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={() => setStep(2)} 
            disabled={!selectedSystemId && !selectedTemplate}
          >
            Continue
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Configure EHR Connection</DialogTitle>
        <DialogDescription>
          Set up the connection details and authentication for {selectedSystem?.display_name || selectedTemplate}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
        {/* Basic Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Configuration</h3>
          
          <div>
            <Label htmlFor="connection_name">Connection Name</Label>
            <Input
              id="connection_name"
              value={formData.connection_name}
              onChange={(e) => setFormData(prev => ({ ...prev, connection_name: e.target.value }))}
              placeholder="e.g., Primary EHR Production"
              required
            />
          </div>

          <div>
            <Label htmlFor="base_url">Base URL</Label>
            <Input
              id="base_url"
              type="url"
              value={formData.base_url}
              onChange={(e) => setFormData(prev => ({ ...prev, base_url: e.target.value }))}
              placeholder="https://fhir.example.com/R4"
              required
            />
          </div>
        </div>

        {/* Authentication Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication
          </h3>

          <div>
            <Label>Authentication Type</Label>
            <Select 
              value={formData.auth_config.type} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                auth_config: { type: value as any }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="smart_on_fhir">SMART on FHIR</SelectItem>
                <SelectItem value="custom">Custom Authentication</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* OAuth2 Fields */}
          {formData.auth_config.type === 'oauth2' && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_id">Client ID</Label>
                  <Input
                    id="client_id"
                    value={formData.auth_config.client_id || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      auth_config: { ...prev.auth_config, client_id: e.target.value }
                    }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client_secret">Client Secret</Label>
                  <div className="relative">
                    <Input
                      id="client_secret"
                      type={showPassword ? "text" : "password"}
                      value={formData.auth_config.client_secret || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        auth_config: { ...prev.auth_config, client_secret: e.target.value }
                      }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="scope">Scope</Label>
                <Input
                  id="scope"
                  value={formData.auth_config.scope || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    auth_config: { ...prev.auth_config, scope: e.target.value }
                  }))}
                  placeholder="patient/*.read user/*.read"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="authorization_url">Authorization URL</Label>
                  <Input
                    id="authorization_url"
                    type="url"
                    value={formData.auth_config.authorization_url || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      auth_config: { ...prev.auth_config, authorization_url: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="token_url">Token URL</Label>
                  <Input
                    id="token_url"
                    type="url"
                    value={formData.auth_config.token_url || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      auth_config: { ...prev.auth_config, token_url: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* API Key Fields */}
          {formData.auth_config.type === 'api_key' && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <Label htmlFor="api_key">API Key</Label>
                <div className="relative">
                  <Input
                    id="api_key"
                    type={showPassword ? "text" : "password"}
                    value={formData.auth_config.api_key || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      auth_config: { ...prev.auth_config, api_key: e.target.value }
                    }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="api_key_header">Header Name</Label>
                <Input
                  id="api_key_header"
                  value={formData.auth_config.api_key_header || 'Authorization'}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    auth_config: { ...prev.auth_config, api_key_header: e.target.value }
                  }))}
                  placeholder="Authorization"
                />
              </div>
            </div>
          )}

          {/* Custom Auth Fields */}
          {formData.auth_config.type === 'custom' && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.auth_config.username || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      auth_config: { ...prev.auth_config, username: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.auth_config.password || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        auth_config: { ...prev.auth_config, password: e.target.value }
                      }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sync Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Sync Configuration
          </h3>

          <div>
            <Label>Sync Frequency</Label>
            <Select 
              value={formData.sync_config?.sync_frequency || 'manual'} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                sync_config: { 
                  ...prev.sync_config, 
                  sync_frequency: value as any 
                }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="realtime">Real-time</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.connection_name || !formData.base_url}>
          Create Connection
        </Button>
      </DialogFooter>
    </form>
  );
}

function EHRConnectionCard({ 
  connection, 
  onTest, 
  onDelete,
  isTesting
}: { 
  connection: EHRConnection; 
  onTest: () => void; 
  onDelete: () => void;
  isTesting: boolean;
}) {
  const statusColor = getConnectionStatusColor(connection.status);
  const statusLabel = getConnectionStatusLabel(connection.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {connection.connection_name}
              <Badge className={statusColor}>
                {isTesting ? 'Testing...' : statusLabel}
              </Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {connection.ehr_system?.display_name || 'Unknown System'}
              </span>
              <span className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                {connection.ehr_system?.api_type?.toUpperCase()}
              </span>
              {connection.last_sync_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Last sync: {new Date(connection.last_sync_at).toLocaleDateString()}
                </span>
              )}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onTest}
              disabled={isTesting}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTesting ? 'Testing...' : 'Test'}
            </Button>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Base URL</Label>
              <p className="text-sm text-muted-foreground font-mono">{connection.base_url}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Environment</Label>
              <p className="text-sm text-muted-foreground capitalize">{connection.environment}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Authentication</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {connection.auth_config?.type || 'Not configured'}
              </Badge>
              {connection.auth_config?.has_credentials ? (
                <Badge variant="outline" className="text-xs text-green-600">
                  <Shield className="h-3 w-3 mr-1" />
                  Credentials configured
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  No credentials
                </Badge>
              )}
            </div>
          </div>

          {connection.last_error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {connection.last_error}
              </AlertDescription>
            </Alert>
          )}

          {connection.ehr_system?.documentation_url && (
            <div className="pt-2 border-t">
              <a 
                href={connection.ehr_system.documentation_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View API Documentation
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}