import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Key,
  Plus,
  Copy,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { getAvailableScopes } from '@/lib/auth/api-scopes';

interface ApiKey {
  id: string;
  name: string;
  description?: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsed?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface SecurityTabProps {
  organizationId: string;
  validationSettings: {
    auditLogging?: {
      logRuleApplications?: boolean;
      logAutoFixes?: boolean;
      retentionPeriod?: string;
    };
  };
  onSettingChange: (key: string, value: any) => void;
}

export function SecurityTab({ organizationId, validationSettings, onSettingChange }: Readonly<SecurityTabProps>) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [newApiKeyData, setNewApiKeyData] = useState({
    name: '',
    description: '',
    scopes: [] as string[],
    expiresAt: '',
  });
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);

  const availableScopes = getAvailableScopes();

  const handleSettingChange = (key: string, value: any) => {
    onSettingChange(key, value);
  };

  // Load API keys
  const loadApiKeys = async () => {
    try {
      setApiKeysLoading(true);
      const response = await fetch(`/api/api-keys?organizationId=${organizationId}`);
      const data = await response.json();

      if (response.ok) {
        setApiKeys(data.apiKeys || []);
      } else {
        toast.error(data.error || 'Failed to load API keys');
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setApiKeysLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, [organizationId]);

  // Create new API key
  const handleCreateApiKey = async () => {
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newApiKeyData,
          organizationId,
          expiresAt: newApiKeyData.expiresAt || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewlyCreatedKey(data.key);
        setShowNewKey(true);
        setShowCreateDialog(false);
        setNewApiKeyData({ name: '', description: '', scopes: [], expiresAt: '' });
        await loadApiKeys();
        toast.success('API key created successfully');
      } else {
        toast.error(data.error || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    }
  };

  // Update API key
  const handleUpdateApiKey = async () => {
    if (!selectedApiKey) return;

    try {
      const response = await fetch(`/api/api-keys/${selectedApiKey.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedApiKey.name,
          description: selectedApiKey.description,
          scopes: selectedApiKey.scopes,
          isActive: selectedApiKey.isActive,
          expiresAt: selectedApiKey.expiresAt || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowEditDialog(false);
        setSelectedApiKey(null);
        await loadApiKeys();
        toast.success('API key updated successfully');
      } else {
        toast.error(data.error || 'Failed to update API key');
      }
    } catch (error) {
      console.error('Error updating API key:', error);
      toast.error('Failed to update API key');
    }
  };

  // Delete API key
  const handleDeleteApiKey = async () => {
    if (!selectedApiKey) return;

    try {
      const response = await fetch(`/api/api-keys/${selectedApiKey.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setShowDeleteDialog(false);
        setSelectedApiKey(null);
        await loadApiKeys();
        toast.success('API key deleted successfully');
      } else {
        toast.error(data.error || 'Failed to delete API key');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Access Controls
        </h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Default User Role</Label>
            <Select defaultValue="PA Coordinator">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PA Coordinator">PA Coordinator</SelectItem>
                <SelectItem value="PA Reviewer">PA Reviewer</SelectItem>
                <SelectItem value="Administrator">Administrator</SelectItem>
                <SelectItem value="Read Only">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Require MFA</Label>
              <p className="text-sm text-muted-foreground">
                Require multi-factor authentication for all users
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Session Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Automatically log out inactive users
              </p>
            </div>
            <Select defaultValue="1 hour">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30 minutes">30 minutes</SelectItem>
                <SelectItem value="1 hour">1 hour</SelectItem>
                <SelectItem value="4 hours">4 hours</SelectItem>
                <SelectItem value="8 hours">8 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            API Keys
          </h3>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create API Key
          </Button>
        </div>

        {apiKeysLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading API keys...</div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No API keys created yet. Create your first API key to start using the API.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {apiKey.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={apiKey.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {apiKey.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date() && (
                        <Badge variant="destructive" className="text-xs">
                          Expired
                        </Badge>
                      )}
                    </div>
                  </div>

                  {apiKey.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {apiKey.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Key className="h-3 w-3" />
                      <span>{apiKey.keyPrefix}...</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Created {formatDate(apiKey.createdAt)}</span>
                    </div>

                    {apiKey.lastUsed && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Last used {formatDate(apiKey.lastUsed)}</span>
                      </div>
                    )}

                    {apiKey.expiresAt && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Expires {formatDate(apiKey.expiresAt)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {apiKey.scopes.map((scope) => (
                      <Badge key={scope} variant="outline" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedApiKey(apiKey);
                      setShowEditDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedApiKey(apiKey);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Audit & Compliance
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Enable Audit Logging</Label>
              <p className="text-sm text-muted-foreground">
                Track all user actions and system events
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">HIPAA Compliance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable additional privacy and security controls
              </p>
            </div>
            <Switch checked disabled />
          </div>

          {/* Detailed Audit Trail Configuration */}
          <div className="border-t pt-6 space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
              Detailed Audit Trail Configuration
            </h4>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Log All Rule Applications
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track when validation rules are applied and their outcomes
                </p>
              </div>
              <Switch
                checked={
                  validationSettings.auditLogging?.logRuleApplications || false
                }
                onCheckedChange={(checked) =>
                  handleSettingChange("auditLogging", {
                    ...validationSettings.auditLogging,
                    logRuleApplications: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Log Auto-Fix Actions
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Record all automatic corrections made to claims and ePAs
                </p>
              </div>
              <Switch
                checked={validationSettings.auditLogging?.logAutoFixes || false}
                onCheckedChange={(checked) =>
                  handleSettingChange("auditLogging", {
                    ...validationSettings.auditLogging,
                    logAutoFixes: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Audit Log Retention Period
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  How long to keep detailed audit trail records for compliance
                </p>
              </div>
              <Select
                value={
                  validationSettings.auditLogging?.retentionPeriod ?? "7years"
                }
                onValueChange={(value) =>
                  handleSettingChange("auditLogging", {
                    ...validationSettings.auditLogging,
                    retentionPeriod: value,
                  })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">30 days</SelectItem>
                  <SelectItem value="90days">90 days</SelectItem>
                  <SelectItem value="1year">1 year</SelectItem>
                  <SelectItem value="3years">3 years</SelectItem>
                  <SelectItem value="7years">7 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Original Data Retention Setting */}
          <div className="space-y-2 border-t pt-4">
            <Label>General Data Retention Period</Label>
            <Select defaultValue="7 years">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1 year">1 year</SelectItem>
                <SelectItem value="2 years">2 years</SelectItem>
                <SelectItem value="5 years">5 years</SelectItem>
                <SelectItem value="7 years">7 years</SelectItem>
                <SelectItem value="Indefinite">Indefinite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for programmatic access to your organization&apos;s data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Production API Key"
                value={newApiKeyData.name}
                onChange={(e) =>
                  setNewApiKeyData({ ...newApiKeyData, name: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Used for production integrations..."
                value={newApiKeyData.description}
                onChange={(e) =>
                  setNewApiKeyData({ ...newApiKeyData, description: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Scopes *</Label>
              <div className="grid grid-cols-1 gap-3 mt-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {Object.entries(availableScopes).map(([category, scopes]) => (
                  <div key={category} className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize border-b pb-1">
                      {category}
                    </div>
                    <div className="space-y-2 pl-2">
                      {scopes.map((scope) => (
                        <div key={scope} className="flex items-center space-x-2">
                          <Checkbox
                            id={scope}
                            checked={newApiKeyData.scopes.includes(scope)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewApiKeyData({
                                  ...newApiKeyData,
                                  scopes: [...newApiKeyData.scopes, scope],
                                });
                              } else {
                                setNewApiKeyData({
                                  ...newApiKeyData,
                                  scopes: newApiKeyData.scopes.filter((s) => s !== scope),
                                });
                              }
                            }}
                          />
                          <Label htmlFor={scope} className="text-sm cursor-pointer">
                            {scope}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={newApiKeyData.expiresAt}
                onChange={(e) =>
                  setNewApiKeyData({ ...newApiKeyData, expiresAt: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateApiKey}
              disabled={!newApiKeyData.name || newApiKeyData.scopes.length === 0}
            >
              Create API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit API Key Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit API Key</DialogTitle>
            <DialogDescription>
              Update the API key settings and permissions.
            </DialogDescription>
          </DialogHeader>

          {selectedApiKey && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={selectedApiKey.name}
                  onChange={(e) =>
                    setSelectedApiKey({ ...selectedApiKey, name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedApiKey.description || ''}
                  onChange={(e) =>
                    setSelectedApiKey({ ...selectedApiKey, description: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit-active">Active</Label>
                <Switch
                  id="edit-active"
                  checked={selectedApiKey.isActive}
                  onCheckedChange={(checked) =>
                    setSelectedApiKey({ ...selectedApiKey, isActive: checked })
                  }
                />
              </div>

              <div>
                <Label>Scopes *</Label>
                <div className="grid grid-cols-1 gap-3 mt-2 max-h-60 overflow-y-auto border rounded-md p-3">
                  {Object.entries(availableScopes).map(([category, scopes]) => (
                    <div key={category} className="space-y-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize border-b pb-1">
                        {category}
                      </div>
                      <div className="space-y-2 pl-2">
                        {scopes.map((scope) => (
                          <div key={scope} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${scope}`}
                              checked={selectedApiKey.scopes.includes(scope)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedApiKey({
                                    ...selectedApiKey,
                                    scopes: [...selectedApiKey.scopes, scope],
                                  });
                                } else {
                                  setSelectedApiKey({
                                    ...selectedApiKey,
                                    scopes: selectedApiKey.scopes.filter((s) => s !== scope),
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`edit-${scope}`} className="text-sm cursor-pointer">
                              {scope}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-expiresAt">Expiration Date</Label>
                <Input
                  id="edit-expiresAt"
                  type="datetime-local"
                  value={selectedApiKey.expiresAt ? new Date(selectedApiKey.expiresAt).toISOString().slice(0, 16) : ''}
                  onChange={(e) =>
                    setSelectedApiKey({ ...selectedApiKey, expiresAt: e.target.value || undefined })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateApiKey}
              disabled={!selectedApiKey?.name || selectedApiKey?.scopes.length === 0}
            >
              Update API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete API Key Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this API key? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedApiKey && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{selectedApiKey.name}</strong> ({selectedApiKey.keyPrefix}...) will be permanently deleted.
                Any applications using this key will lose access immediately.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteApiKey}
            >
              Delete API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show New API Key Dialog */}
      <Dialog open={showNewKey} onOpenChange={setShowNewKey}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Your API key has been created successfully. Copy it now - this is the only time it will be shown.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Your new API key:</div>
                <div className="font-mono text-sm p-2 bg-muted rounded flex items-center justify-between">
                  <span className="break-all">{newlyCreatedKey}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => newlyCreatedKey && copyToClipboard(newlyCreatedKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowNewKey(false);
                setNewlyCreatedKey(null);
              }}
            >
              I&apos;ve Saved the Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
