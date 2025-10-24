'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Plus,
  X,
  Settings,
  AlertCircle,
  CheckCircle,
  Upload,
  Info,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  s3Key: string;
}

interface PayerSpecificSettings {
  [payerId: string]: {
    defaultDocuments?: string[];
    autoAttachEnabled?: boolean;
    documentCategories?: Record<string, string[]>;
  };
}

interface PriorAuthDocumentsSettings {
  id?: string;
  organizationId: string;
  defaultDocuments: string[];
  autoAttachEnabled: boolean;
  documentCategories: Record<string, string[]>;
  payerSpecificSettings: PayerSpecificSettings;
  description?: string;
  isActive: boolean;
}

interface PriorAuthDocumentsTabProps {
  organizationId: string;
  teamSlug: string;
  onSave?: (settings: PriorAuthDocumentsSettings) => void;
}

const DOCUMENT_CATEGORIES = [
  { value: 'prior_auth', label: 'Prior Authorization' },
  { value: 'appeals', label: 'Appeals' },
  { value: 'medical_records', label: 'Medical Records' },
  { value: 'lab_results', label: 'Lab Results' },
  { value: 'imaging', label: 'Imaging Reports' },
  { value: 'clinical_notes', label: 'Clinical Notes' },
];

export function PriorAuthDocumentsTab({
  organizationId,
  teamSlug,
  onSave,
}: Readonly<PriorAuthDocumentsTabProps>) {
  const [settings, setSettings] = useState<PriorAuthDocumentsSettings>({
    organizationId,
    defaultDocuments: [],
    autoAttachEnabled: true,
    documentCategories: {},
    payerSpecificSettings: {},
    isActive: true,
  });

  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  const [payers, setPayers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);
  const [showPayerSettingsDialog, setShowPayerSettingsDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedPayer, setSelectedPayer] = useState<string>('');
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load existing PA settings
      const settingsResponse = await fetch(`/api/organizations/${organizationId}/pa-settings`);
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData.success && settingsData.data) {
          setSettings(settingsData.data);
        }
      }

      // Load payers
      const payersResponse = await fetch(`/api/organizations/${organizationId}/pa-settings/payers`);
      if (payersResponse.ok) {
        const payersData = await payersResponse.json();
        if (payersData.success) {
          setPayers(payersData.data.availablePayers || []);
        }
      }
    } catch (error) {
      console.error('Error loading PA documents settings:', error);
      toast.error('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      const response = await fetch(`/api/organizations/${organizationId}/pa-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setSettings(result.data);
        toast.success('Settings saved', {
          description: 'Your prior authorization document settings have been updated.',
        });
        onSave?.(result.data);
      }
    } catch (error) {
      console.error('Error saving PA documents settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) return;

    try {
      setUploadingDocument(true);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('metadata', JSON.stringify({ category: 'prior_auth' }));

      const response = await fetch(`/api/organizations/${organizationId}/pa-settings/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      const result = await response.json();
      if (result.success && result.data.document) {
        const newDocument = result.data.document;
        setAvailableDocuments(prev => [...prev, newDocument]);
        
        // Automatically add the uploaded document as a default
        handleAddDocument(newDocument.id);
        
        toast.success('Document uploaded', {
          description: `${newDocument.name} has been uploaded and added as a default document.`,
        });

        setSelectedFile(null);
        setShowUploadDialog(false);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleAddDocument = (documentId: string) => {
    if (!settings.defaultDocuments.includes(documentId)) {
      setSettings(prev => ({
        ...prev,
        defaultDocuments: [...prev.defaultDocuments, documentId],
      }));
    }
  };

  const handleRemoveDocument = (documentId: string) => {
    setSettings(prev => ({
      ...prev,
      defaultDocuments: prev.defaultDocuments.filter(id => id !== documentId),
    }));
  };

  const handleUpdateDocumentCategory = (category: string, documentIds: string[]) => {
    setSettings(prev => ({
      ...prev,
      documentCategories: {
        ...prev.documentCategories,
        [category]: documentIds,
      },
    }));
  };

  const handleUpdatePayerSettings = (payerId: string, payerSettings: PayerSpecificSettings[string]) => {
    setSettings(prev => ({
      ...prev,
      payerSpecificSettings: {
        ...prev.payerSpecificSettings,
        [payerId]: payerSettings,
      },
    }));
  };

  const getDocumentById = (documentId: string) => {
    return availableDocuments.find(doc => doc.id === documentId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium">Prior Authorization Documents</h3>
        <p className="text-sm text-muted-foreground">
          Configure default documents that are automatically attached to all prior authorization submissions.
        </p>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Global Settings
          </CardTitle>
          <CardDescription>
            Organization-wide settings for default documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-attach">Auto-attach default documents</Label>
              <p className="text-sm text-muted-foreground">
                Automatically include default documents in all PA submissions
              </p>
            </div>
            <Switch
              id="auto-attach"
              checked={settings.autoAttachEnabled}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, autoAttachEnabled: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your default document configuration..."
              value={settings.description || ''}
              onChange={(e) =>
                setSettings(prev => ({ ...prev, description: e.target.value }))
              }
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Default Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Default Documents
          </CardTitle>
          <CardDescription>
            Documents that will be automatically attached to all prior authorization submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.defaultDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No default documents configured</p>
              <p className="text-sm">Add documents that should be included with every PA submission</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {settings.defaultDocuments.map(documentId => {
                const document = getDocumentById(documentId);
                return (
                  <div
                    key={documentId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{document?.name || documentId}</p>
                        <p className="text-sm text-muted-foreground">
                          {document?.type} • {document ? formatFileSize(document.size) : 'Unknown size'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDocument(documentId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Dialog open={showAddDocumentDialog} onOpenChange={setShowAddDocumentDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Existing Document
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Upload a new document to use as a default for prior authorization submissions.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Select File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Supported formats: PDF, Word documents, images (JPG, PNG), and text files. Maximum size: 10MB.
                    </p>
                  </div>

                  {selectedFile && (
                    <div className="p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedFile.type} • {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setShowUploadDialog(false);
                    setSelectedFile(null);
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUploadDocument} 
                    disabled={!selectedFile || uploadingDocument}
                  >
                    {uploadingDocument ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload & Add as Default
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={showAddDocumentDialog} onOpenChange={setShowAddDocumentDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Default Document</DialogTitle>
                <DialogDescription>
                  Select a document to automatically include with all prior authorization submissions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {availableDocuments
                    .filter(doc => !settings.defaultDocuments.includes(doc.id))
                    .map(document => (
                      <div
                        key={document.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          handleAddDocument(document.id);
                          setShowAddDocumentDialog(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{document.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {document.type} • {formatFileSize(document.size)}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
                {availableDocuments.filter(doc => !settings.defaultDocuments.includes(doc.id)).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    All available documents are already added as defaults.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Document Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Document Categories</CardTitle>
          <CardDescription>
            Organize documents by submission type for better automation control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DOCUMENT_CATEGORIES.map(category => (
            <div key={category.value} className="space-y-2">
              <Label>{category.label}</Label>
              <Select
                value=""
                onValueChange={(documentId) => {
                  const currentDocs = settings.documentCategories[category.value] || [];
                  if (!currentDocs.includes(documentId)) {
                    handleUpdateDocumentCategory(category.value, [...currentDocs, documentId]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Add documents for ${category.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {availableDocuments
                    .filter(doc => !(settings.documentCategories[category.value] || []).includes(doc.id))
                    .map(document => (
                      <SelectItem key={document.id} value={document.id}>
                        {document.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {settings.documentCategories[category.value]?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {settings.documentCategories[category.value].map(documentId => {
                    const document = getDocumentById(documentId);
                    return (
                      <Badge key={documentId} variant="secondary" className="gap-1">
                        {document?.name || documentId}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => {
                            const currentDocs = settings.documentCategories[category.value];
                            handleUpdateDocumentCategory(
                              category.value,
                              currentDocs.filter(id => id !== documentId)
                            );
                          }}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payer-Specific Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payer-Specific Settings</CardTitle>
          <CardDescription>
            Override default document settings for specific payers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(settings.payerSpecificSettings).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payer-specific settings configured</p>
              <p className="text-sm">Configure different document defaults for specific payers</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(settings.payerSpecificSettings).map(([payerId, payerSettings]) => {
                const payer = payers.find(p => p.id === payerId);
                return (
                  <div key={payerId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{payer?.name || payerId}</h4>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Payer Settings</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the custom settings for {payer?.name} and revert to default organization settings.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                const newSettings = { ...settings.payerSpecificSettings };
                                delete newSettings[payerId];
                                setSettings(prev => ({
                                  ...prev,
                                  payerSpecificSettings: newSettings,
                                }));
                              }}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Auto-attach: {payerSettings.autoAttachEnabled ? 'Enabled' : 'Disabled'}</p>
                      <p>Default documents: {payerSettings.defaultDocuments?.length || 0}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Dialog open={showPayerSettingsDialog} onOpenChange={setShowPayerSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Payer-Specific Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configure Payer-Specific Settings</DialogTitle>
                <DialogDescription>
                  Override default document settings for a specific payer.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Payer</Label>
                  <Select value={selectedPayer} onValueChange={setSelectedPayer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a payer" />
                    </SelectTrigger>
                    <SelectContent>
                      {payers
                        .filter(payer => !settings.payerSpecificSettings[payer.id])
                        .map(payer => (
                          <SelectItem key={payer.id} value={payer.id}>
                            {payer.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPayerSettingsDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedPayer) {
                      handleUpdatePayerSettings(selectedPayer, {
                        autoAttachEnabled: true,
                        defaultDocuments: [],
                        documentCategories: {},
                      });
                      setSelectedPayer('');
                      setShowPayerSettingsDialog(false);
                    }
                  }}
                  disabled={!selectedPayer}
                >
                  Configure
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How Default Documents Work</p>
              <ul className="space-y-1 text-sm">
                <li>• Default documents are automatically added to every PA submission</li>
                <li>• Payer-specific settings override organization defaults</li>
                <li>• Document categories help organize attachments by submission type</li>
                <li>• All documents go through the same validation process</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
