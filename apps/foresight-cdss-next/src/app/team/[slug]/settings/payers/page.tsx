"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Settings,
  Trash2,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Key,
  Eye,
  EyeOff,
  TrendingUp,
  FileText
} from 'lucide-react';
import type {
  PayerWithConfig,
  CreatePayerRequest,
  CreatePayerConfigRequest,
  CreatePayerPortalCredentialRequest,
  PayerConfigType,
  PopularPayerKey
} from '@/types/payer.types';
import {
  POPULAR_PAYERS,
  getPayerStatusColor,
  getPayerStatusLabel,
  getConfigTypeLabel
} from '@/types/payer.types';

export default function PayersPage() {
  const [payers, setPayers] = useState<PayerWithConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPayer, setSelectedPayer] = useState<PayerWithConfig | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);

  useEffect(() => {
    fetchPayers();
  }, []);

  const fetchPayers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payers');
      const data = await response.json();

      if (response.ok) {
        setPayers(data.payers || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch payers');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayer = async (formData: CreatePayerRequest) => {
    try {
      const response = await fetch('/api/payers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setIsCreateOpen(false);
        fetchPayers();
      } else {
        setError(data.error || 'Failed to create payer');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleDeletePayer = async (payerId: number, payerName: string) => {
    if (!confirm(`Are you sure you want to delete "${payerName}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/payers/${payerId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchPayers();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete payer');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleConfigurePayer = (payer: PayerWithConfig) => {
    setSelectedPayer(payer);
    setIsConfigOpen(true);
  };

  const handleManageCredentials = (payer: PayerWithConfig) => {
    setSelectedPayer(payer);
    setIsCredentialsOpen(true);
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payer Configuration</h1>
          <p className="text-muted-foreground">
            Manage insurance payers, configure submission settings, and maintain portal credentials
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Payer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <CreatePayerForm
              onSubmit={handleCreatePayer}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <CardDescription>{error}</CardDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading payers...</div>
        ) : payers.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No payers configured</h3>
                <p className="text-muted-foreground mb-4">
                  Add insurance payers to manage claims, prior authorizations, and portal access
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Payer
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {payers.map((payerWithConfig) => (
              <PayerCard
                key={payerWithConfig.payer.id}
                payerWithConfig={payerWithConfig}
                onConfigure={() => handleConfigurePayer(payerWithConfig)}
                onCredentials={() => handleManageCredentials(payerWithConfig)}
                onDelete={() => handleDeletePayer(payerWithConfig.payer.id, payerWithConfig.payer.name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPayer && (
            <PayerConfigurationForm
              payer={selectedPayer}
              onClose={() => setIsConfigOpen(false)}
              onUpdate={fetchPayers}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={isCredentialsOpen} onOpenChange={setIsCredentialsOpen}>
        <DialogContent className="max-w-2xl">
          {selectedPayer && (
            <PayerCredentialsForm
              payer={selectedPayer}
              onClose={() => setIsCredentialsOpen(false)}
              onUpdate={fetchPayers}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreatePayerForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (data: CreatePayerRequest) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<PopularPayerKey | null>(null);
  const [formData, setFormData] = useState<CreatePayerRequest>({
    name: '',
    external_payer_id: '',
    payer_type: 'general'
  });

  const handleTemplateSelect = (templateKey: PopularPayerKey) => {
    const template = POPULAR_PAYERS[templateKey];
    setSelectedTemplate(templateKey);
    setFormData({
      name: template.name,
      external_payer_id: template.external_payer_id,
      payer_type: template.payer_type
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (step === 1) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Choose Payer Type</DialogTitle>
          <DialogDescription>
            Select a popular insurance payer or create a custom configuration
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Popular Payers */}
            {Object.entries(POPULAR_PAYERS).map(([key, template]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-all ${selectedTemplate === key ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => handleTemplateSelect(key as PopularPayerKey)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{template.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">ID: {template.external_payer_id}</p>
                      <Badge variant="outline" className="text-xs mt-2">
                        {getConfigTypeLabel(template.payer_type)}
                      </Badge>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {selectedTemplate === key && <CheckCircle className="h-5 w-5 text-primary" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Custom Option */}
            <Card
              className={`cursor-pointer transition-all ${selectedTemplate === null && formData.name ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
              onClick={() => {
                setSelectedTemplate(null);
                setFormData({ name: '', external_payer_id: '', payer_type: 'general' });
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">Custom Payer</h3>
                    <p className="text-sm text-muted-foreground">Configure a custom insurance payer</p>
                    <Badge variant="outline" className="text-xs mt-2">Custom</Badge>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {!selectedTemplate && formData.name && <CheckCircle className="h-5 w-5 text-primary" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => setStep(2)}
            disabled={!selectedTemplate && !formData.name}
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
        <DialogTitle>Payer Details</DialogTitle>
        <DialogDescription>
          Configure the basic information for {selectedTemplate ? POPULAR_PAYERS[selectedTemplate].name : 'your custom payer'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div>
          <Label htmlFor="name">Payer Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Aetna Better Health"
            required
          />
        </div>

        <div>
          <Label htmlFor="external_payer_id">External Payer ID</Label>
          <Input
            id="external_payer_id"
            value={formData.external_payer_id}
            onChange={(e) => setFormData(prev => ({ ...prev, external_payer_id: e.target.value }))}
            placeholder="e.g., AETNA_BH, 12345"
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            The unique identifier used by this payer (often found on ID cards)
          </p>
        </div>

        <div>
          <Label>Configuration Type</Label>
          <Select
            value={formData.payer_type}
            onValueChange={(value: PayerConfigType) => setFormData(prev => ({
              ...prev,
              payer_type: value
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Configuration</SelectItem>
              <SelectItem value="portal">Portal Access</SelectItem>
              <SelectItem value="submission">Claim Submission</SelectItem>
              <SelectItem value="eligibility">Eligibility Verification</SelectItem>
              <SelectItem value="pa_submission">Prior Authorization</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.name || !formData.external_payer_id}>
          Create Payer
        </Button>
      </DialogFooter>
    </form>
  );
}

function PayerCard({
  payerWithConfig,
  onConfigure,
  onCredentials,
  onDelete
}: {
  payerWithConfig: PayerWithConfig;
  onConfigure: () => void;
  onCredentials: () => void;
  onDelete: () => void;
}) {
  const { payer, config, portal_credential, performance_stats } = payerWithConfig;

  const hasConfig = !!config;
  const hasCredentials = !!portal_credential;
  const statusColor = getPayerStatusColor(hasConfig, hasCredentials);
  const statusLabel = getPayerStatusLabel(hasConfig, hasCredentials);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {payer.name}
              <Badge className={statusColor}>
                {statusLabel}
              </Badge>
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-4 mt-2">
              <span className="flex items-center gap-1 min-w-0">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">ID: {payer.external_payer_id}</span>
              </span>
              {config && (
                <span className="flex items-center gap-1 min-w-0">
                  <Settings className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{getConfigTypeLabel(config.config_type)}</span>
                </span>
              )}
              {performance_stats && (
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <TrendingUp className="h-4 w-4 flex-shrink-0" />
                  {performance_stats.approval_rate}% approval rate
                </span>
              )}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onCredentials}>
              <Key className="h-4 w-4 mr-2" />
              Credentials
            </Button>
            <Button size="sm" variant="outline" onClick={onConfigure}>
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{performance_stats?.total_claims || 0}</div>
              <div className="text-xs text-muted-foreground">Total Claims</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{performance_stats?.approval_rate || 0}%</div>
              <div className="text-xs text-muted-foreground">Approval Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{performance_stats?.avg_response_time_days || 0}</div>
              <div className="text-xs text-muted-foreground">Avg Response (days)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {performance_stats?.last_submission ?
                  new Date(performance_stats.last_submission).toLocaleDateString() : 'Never'
                }
              </div>
              <div className="text-xs text-muted-foreground">Last Activity</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label className="text-sm font-medium">Configuration Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {hasConfig ? (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Configured
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Portal Access</Label>
              <div className="flex items-center gap-2 mt-1">
                {hasCredentials ? (
                  <Badge variant="outline" className="text-green-600">
                    <Key className="h-3 w-3 mr-1" />
                    Credentials Set
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600">
                    <Key className="h-3 w-3 mr-1" />
                    No Credentials
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PayerConfigurationForm({
  payer,
  onClose,
  onUpdate
}: {
  payer: PayerWithConfig;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [formData, setFormData] = useState<CreatePayerConfigRequest>({
    payer_id: payer.payer.id,
    config_type: payer.config?.config_type || 'general',
    auto_submit_claims: payer.config?.auto_submit_claims || false,
    auto_submit_pa: payer.config?.auto_submit_pa || false,
    timely_filing_days: payer.config?.timely_filing_days || 365,
    eligibility_cache_hours: payer.config?.eligibility_cache_hours || 24,
    submission_batch_size: payer.config?.submission_batch_size || 50,
    submission_schedule: payer.config?.submission_schedule || 'daily',
    portal_config: payer.config?.portal_config || {},
    special_rules: payer.config?.special_rules || {}
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const method = payer.config ? 'PUT' : 'POST';
      const url = payer.config
        ? `/api/payers/${payer.payer.id}/config/${payer.config.id}`
        : `/api/payers/${payer.payer.id}/config`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        setError(data.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Configure {payer.payer.name}</DialogTitle>
        <DialogDescription>
          Set up submission rules, automation settings, and portal configuration
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <CardDescription>{error}</CardDescription>
          </Alert>
        )}

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="portal">Portal</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div>
              <Label>Configuration Type</Label>
              <Select
                value={formData.config_type}
                onValueChange={(value: PayerConfigType) => setFormData(prev => ({
                  ...prev,
                  config_type: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Configuration</SelectItem>
                  <SelectItem value="portal">Portal Access</SelectItem>
                  <SelectItem value="submission">Claim Submission</SelectItem>
                  <SelectItem value="eligibility">Eligibility Verification</SelectItem>
                  <SelectItem value="pa_submission">Prior Authorization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timely_filing_days">Timely Filing Days</Label>
                <Input
                  id="timely_filing_days"
                  type="number"
                  min="30"
                  max="730"
                  value={formData.timely_filing_days}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    timely_filing_days: parseInt(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="eligibility_cache_hours">Eligibility Cache Hours</Label>
                <Input
                  id="eligibility_cache_hours"
                  type="number"
                  min="1"
                  max="168"
                  value={formData.eligibility_cache_hours}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    eligibility_cache_hours: parseInt(e.target.value)
                  }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="submission_batch_size">Submission Batch Size</Label>
              <Input
                id="submission_batch_size"
                type="number"
                min="1"
                max="500"
                value={formData.submission_batch_size}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  submission_batch_size: parseInt(e.target.value)
                }))}
              />
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Auto-Submit Claims</Label>
                <p className="text-sm text-muted-foreground">Automatically submit approved claims</p>
              </div>
              <Switch
                checked={formData.auto_submit_claims}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  auto_submit_claims: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Auto-Submit Prior Authorizations</Label>
                <p className="text-sm text-muted-foreground">Automatically submit completed PAs</p>
              </div>
              <Switch
                checked={formData.auto_submit_pa}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  auto_submit_pa: checked
                }))}
              />
            </div>

            <div>
              <Label>Submission Schedule</Label>
              <Select
                value={formData.submission_schedule}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  submission_schedule: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="portal" className="space-y-4">
            <Alert>
              <Building2 className="h-4 w-4" />
              <CardDescription>
                Portal configuration settings will be available after setting up credentials for this payer.
              </CardDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <CardDescription>
                Special rules and billing requirements will be configurable in the next release.
              </CardDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (payer.config ? 'Update Configuration' : 'Create Configuration')}
        </Button>
      </DialogFooter>
    </form>
  );
}

function PayerCredentialsForm({
  payer,
  onClose,
  onUpdate
}: {
  payer: PayerWithConfig;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [formData, setFormData] = useState<CreatePayerPortalCredentialRequest>({
    payer_id: payer.payer.id,
    portal_url: payer.portal_credential?.portal_url || '',
    username: payer.portal_credential?.username || '',
    password: '',
    mfa_enabled: payer.portal_credential?.mfa_enabled || false,
    automation_enabled: payer.portal_credential?.automation_enabled || false,
    security_questions: []
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const method = payer.portal_credential ? 'PUT' : 'POST';
      const url = `/api/payers/${payer.payer.id}/credentials`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        setError(data.error || 'Failed to save credentials');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Portal Credentials - {payer.payer.name}</DialogTitle>
        <DialogDescription>
          Configure login credentials for automated portal access
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <CardDescription>{error}</CardDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="portal_url">Portal URL</Label>
          <Input
            id="portal_url"
            type="url"
            value={formData.portal_url}
            onChange={(e) => setFormData(prev => ({ ...prev, portal_url: e.target.value }))}
            placeholder="https://portal.payer.com/login"
            required
          />
        </div>

        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            placeholder="your_username"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder={payer.portal_credential ? "Leave blank to keep current password" : "Enter password"}
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Multi-Factor Authentication (MFA)</Label>
              <p className="text-sm text-muted-foreground">Portal requires MFA for login</p>
            </div>
            <Switch
              checked={formData.mfa_enabled}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                mfa_enabled: checked
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Enable Automation</Label>
              <p className="text-sm text-muted-foreground">Allow automated portal interactions</p>
            </div>
            <Switch
              checked={formData.automation_enabled}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                automation_enabled: checked
              }))}
            />
          </div>
        </div>

        {payer.portal_credential?.last_successful_login && (
          <div className="p-3 bg-muted rounded-lg">
            <Label className="text-sm font-medium">Last Successful Login</Label>
            <p className="text-sm text-muted-foreground">
              {new Date(payer.portal_credential.last_successful_login).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !formData.portal_url}>
          {loading ? 'Saving...' : (payer.portal_credential ? 'Update Credentials' : 'Save Credentials')}
        </Button>
      </DialogFooter>
    </form>
  );
}
