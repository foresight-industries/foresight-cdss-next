'use client';

import { useState, useEffect } from 'react';
import { Plus, Settings, Eye, Trash2, Copy, AlertTriangle, CheckCircle, Info, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert } from '@/components/ui/alert';
import type {
  CustomFieldMapping,
  CustomFieldMappingWithConnection,
  FieldMappingTemplate,
  EntityType,
  TransformationType,
  ValidationRuleType,
  TransformationRule,
  ValidationRule,
  FieldMappingStats,
  MappingValidationResult
} from '@/types/field-mapping.types';

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'patient', label: 'Patient' },
  { value: 'provider', label: 'Provider' },
  { value: 'claim', label: 'Claim' },
  { value: 'prior_auth', label: 'Prior Authorization' },
  { value: 'medication', label: 'Medication' },
  { value: 'diagnosis', label: 'Diagnosis' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'insurance', label: 'Insurance' }
];

// const DATA_TYPES: { value: FieldDataType; label: string }[] = [
//   { value: 'string', label: 'Text' },
//   { value: 'number', label: 'Number' },
//   { value: 'boolean', label: 'True/False' },
//   { value: 'date', label: 'Date' },
//   { value: 'datetime', label: 'Date & Time' },
//   { value: 'email', label: 'Email' },
//   { value: 'phone', label: 'Phone' },
//   { value: 'url', label: 'URL' },
//   { value: 'json', label: 'JSON Object' },
//   { value: 'array', label: 'Array' }
// ];

const TRANSFORMATION_TYPES: { value: TransformationType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'trim', label: 'Trim Whitespace' },
  { value: 'format_phone', label: 'Format Phone' },
  { value: 'format_date', label: 'Format Date' },
  { value: 'parse_name', label: 'Parse Name' },
  { value: 'extract_number', label: 'Extract Number' },
  { value: 'custom', label: 'Custom Function' }
];

const VALIDATION_TYPES: { value: ValidationRuleType; label: string }[] = [
  { value: 'required', label: 'Required' },
  { value: 'min_length', label: 'Minimum Length' },
  { value: 'max_length', label: 'Maximum Length' },
  { value: 'pattern', label: 'Pattern Match' },
  { value: 'email', label: 'Email Format' },
  { value: 'phone', label: 'Phone Format' },
  { value: 'date', label: 'Date Format' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'custom', label: 'Custom Validation' }
];

export default function FieldMappingsPage() {
  const [mappings, setMappings] = useState<CustomFieldMappingWithConnection[]>([]);
  const [templates, setTemplates] = useState<FieldMappingTemplate[]>([]);
  const [stats, setStats] = useState<FieldMappingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<EntityType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [ehrFilter, setEhrFilter] = useState<string>('all');

  // Modal states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<CustomFieldMapping | null>(null);
  // const [selectedTemplate, setSelectedTemplate] = useState<FieldMappingTemplate | null>(null);

  // Form states
  const [mappingForm, setMappingForm] = useState({
    entity_type: 'patient' as EntityType,
    source_path: '',
    target_table: '',
    target_column: '',
    transformation_rules: [] as TransformationRule[],
    validation_rules: [] as ValidationRule[],
    ehr_connection_id: ''
  });

  const [validationResult, setValidationResult] = useState<MappingValidationResult | null>(null);

  useEffect(() => {
    loadData();
  }, [entityFilter, statusFilter, ehrFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load mappings
      const mappingsParams = new URLSearchParams();
      if (entityFilter !== 'all') mappingsParams.set('entity_type', entityFilter);
      if (statusFilter !== 'all') mappingsParams.set('active_only', (statusFilter === 'active').toString());
      if (ehrFilter !== 'all') mappingsParams.set('ehr_connection_id', ehrFilter);

      const mappingsResponse = await fetch(`/api/field-mappings?${mappingsParams}`);
      if (!mappingsResponse.ok) throw new Error('Failed to load mappings');
      const mappingsData = await mappingsResponse.json();

      setMappings(mappingsData.mappings);
      setStats(mappingsData.stats);

      // Load templates
      const templatesResponse = await fetch('/api/field-mappings/templates');
      if (!templatesResponse.ok) throw new Error('Failed to load templates');
      const templatesData = await templatesResponse.json();
      setTemplates(templatesData.templates);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMapping = async () => {
    try {
      const response = await fetch('/api/field-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappingForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create mapping');
      }

      setShowCreateDialog(false);
      setMappingForm({
        entity_type: 'patient',
        source_path: '',
        target_table: '',
        target_column: '',
        transformation_rules: [],
        validation_rules: [],
        ehr_connection_id: ''
      });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mapping');
    }
  };

  const handleEditMapping = async () => {
    if (!selectedMapping) return;

    try {
      const response = await fetch(`/api/field-mappings/${selectedMapping.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappingForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update mapping');
      }

      setShowEditDialog(false);
      setSelectedMapping(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update mapping');
    }
  };

  const handleDeleteMapping = async (mapping: CustomFieldMapping) => {
    if (!confirm(`Are you sure you want to delete the mapping for "${mapping.source_path}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/field-mappings/${mapping.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete mapping');
      }

      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete mapping');
    }
  };

  const handleValidateMapping = async (mapping: CustomFieldMapping) => {
    try {
      const response = await fetch('/api/field-mappings/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappings: [mapping] })
      });

      if (!response.ok) throw new Error('Failed to validate mapping');

      const data = await response.json();
      setValidationResult(data.validation_result);
      setShowValidationDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate mapping');
    }
  };

  const handleApplyTemplate = (template: FieldMappingTemplate) => {
    // Apply template mappings to create multiple field mappings
    console.log('Applying template:', template);
    // Implementation would create multiple mappings based on template
  };

  const openEditDialog = (mapping: CustomFieldMapping) => {
    setSelectedMapping(mapping);
    setMappingForm({
      entity_type: mapping.entity_type,
      source_path: mapping.source_path,
      target_table: mapping.target_table || '',
      target_column: mapping.target_column || '',
      transformation_rules: mapping.transformation_rules || [],
      validation_rules: mapping.validation_rules || [],
      ehr_connection_id: mapping.ehr_connection_id || ''
    });
    setShowEditDialog(true);
  };

  const filteredMappings = mappings.filter(mapping => {
    const matchesSearch = !searchTerm ||
      mapping.source_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mapping.target_table && mapping.target_table.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getEntityTypeColor = (entityType: EntityType) => {
    const colors: Record<EntityType, string> = {
      patient: 'bg-blue-100 text-blue-800',
      provider: 'bg-purple-100 text-purple-800',
      claim: 'bg-orange-100 text-orange-800',
      prior_auth: 'bg-red-100 text-red-800',
      medication: 'bg-green-100 text-green-800',
      diagnosis: 'bg-yellow-100 text-yellow-800',
      procedure: 'bg-indigo-100 text-indigo-800',
      insurance: 'bg-pink-100 text-pink-800'
    };
    return colors[entityType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Field Mappings</h1>
            <p className="text-gray-600 dark:text-gray-400">Loading field mapping configurations...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Field Mappings</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure custom field mappings for data integration</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <Copy className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Mapping
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <CardDescription>{error}</CardDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Mappings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_mappings}</p>
                </div>
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Mappings</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_mappings}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entity Types</p>
                  <p className="text-2xl font-bold text-purple-600">{Object.keys(stats.by_entity_type).length}</p>
                </div>
                <Filter className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">EHR Systems</p>
                  <p className="text-2xl font-bold text-orange-600">{Object.keys(stats.by_ehr_system).length}</p>
                </div>
                <Info className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Mappings</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by source path, entity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="entity-filter">Entity Type</Label>
              <Select value={entityFilter} onValueChange={(value) => setEntityFilter(value as EntityType | 'all')}>
                <SelectTrigger id="entity-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entity Types</SelectItem>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ehr-filter">EHR System</Label>
              <Select value={ehrFilter} onValueChange={setEhrFilter}>
                <SelectTrigger id="ehr-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All EHR Systems</SelectItem>
                  {/* TODO: Load actual EHR connections */}
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="cerner">Cerner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mappings List */}
      <Card>
        <CardHeader>
          <CardTitle>Field Mappings</CardTitle>
          <CardDescription>
            {filteredMappings.length} mapping{filteredMappings.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMappings.map((mapping) => (
              <div key={mapping.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge className={getEntityTypeColor(mapping.entity_type)}>
                        {ENTITY_TYPES.find(t => t.value === mapping.entity_type)?.label}
                      </Badge>
                      <Badge className={getStatusColor(mapping.is_active)}>
                        {mapping.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {mapping.ehr_connection && (
                        <Badge variant="outline">
                          {mapping.ehr_connection.name}
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {mapping.source_path}
                    </h3>

                    {mapping.target_table && mapping.target_column && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Maps to: {mapping.target_table}.{mapping.target_column}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {mapping.transformation_rules && mapping.transformation_rules.length > 0 && (
                        <span>{mapping.transformation_rules.length} transformation{mapping.transformation_rules.length !== 1 ? 's' : ''}</span>
                      )}
                      {mapping.validation_rules && mapping.validation_rules.length > 0 && (
                        <span>{mapping.validation_rules.length} validation{mapping.validation_rules.length !== 1 ? 's' : ''}</span>
                      )}
                      <span>Created {new Date(mapping.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleValidateMapping(mapping)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(mapping)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMapping(mapping)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredMappings.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No field mappings found</p>
                <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Mapping
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Mapping Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedMapping(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showEditDialog ? 'Edit Field Mapping' : 'Create Field Mapping'}
            </DialogTitle>
            <DialogDescription>
              Configure how data fields are mapped and transformed during integration.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="transformations">Transformations</TabsTrigger>
              <TabsTrigger value="validations">Validations</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entity_type">Entity Type</Label>
                  <Select
                    value={mappingForm.entity_type}
                    onValueChange={(value) => setMappingForm({ ...mappingForm, entity_type: value as EntityType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="source_path">Source Path</Label>
                  <Input
                    id="source_path"
                    placeholder="$.patient.firstName or patient.name.first"
                    value={mappingForm.source_path}
                    onChange={(e) => setMappingForm({ ...mappingForm, source_path: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    JSONPath ($.field) or dot notation (field.subfield)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_table">Target Table</Label>
                  <Input
                    id="target_table"
                    placeholder="patient"
                    value={mappingForm.target_table}
                    onChange={(e) => setMappingForm({ ...mappingForm, target_table: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="target_column">Target Column</Label>
                  <Input
                    id="target_column"
                    placeholder="first_name"
                    value={mappingForm.target_column}
                    onChange={(e) => setMappingForm({ ...mappingForm, target_column: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ehr_connection_id">EHR Connection (Optional)</Label>
                <Select
                  value={mappingForm.ehr_connection_id}
                  onValueChange={(value) => setMappingForm({ ...mappingForm, ehr_connection_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select EHR connection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific connection</SelectItem>
                    {/* TODO: Load actual EHR connections */}
                    <SelectItem value="epic-prod">Epic Production</SelectItem>
                    <SelectItem value="cerner-dev">Cerner Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="transformations" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Data Transformations</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newRule: TransformationRule = {
                      type: 'none',
                      parameters: {},
                      order: mappingForm.transformation_rules.length + 1
                    };
                    setMappingForm({
                      ...mappingForm,
                      transformation_rules: [...mappingForm.transformation_rules, newRule]
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transformation
                </Button>
              </div>

              {mappingForm.transformation_rules.map((rule, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 items-end">
                      <div>
                        <Label>Transformation Type</Label>
                        <Select
                          value={rule.type}
                          onValueChange={(value) => {
                            const newRules = [...mappingForm.transformation_rules];
                            newRules[index] = { ...rule, type: value as TransformationType };
                            setMappingForm({ ...mappingForm, transformation_rules: newRules });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TRANSFORMATION_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Order</Label>
                        <Input
                          type="number"
                          value={rule.order}
                          onChange={(e) => {
                            const newRules = [...mappingForm.transformation_rules];
                            newRules[index] = { ...rule, order: parseInt(e.target.value) || 1 };
                            setMappingForm({ ...mappingForm, transformation_rules: newRules });
                          }}
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newRules = mappingForm.transformation_rules.filter((_, i) => i !== index);
                          setMappingForm({ ...mappingForm, transformation_rules: newRules });
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {(rule.type === 'format_phone' || rule.type === 'format_date' || rule.type === 'custom') && (
                      <div className="mt-4">
                        <Label>Parameters (JSON)</Label>
                        <Textarea
                          placeholder={rule.type === 'format_phone' ? '{"format": "(XXX) XXX-XXXX"}' :
                                     rule.type === 'format_date' ? '{"input_format": "MM/DD/YYYY", "output_format": "YYYY-MM-DD"}' :
                                     '{"param1": "value1"}'}
                          value={JSON.stringify(rule.parameters || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const params = JSON.parse(e.target.value);
                              const newRules = [...mappingForm.transformation_rules];
                              newRules[index] = { ...rule, parameters: params };
                              setMappingForm({ ...mappingForm, transformation_rules: newRules });
                            } catch {
                              // Invalid JSON, ignore
                            }
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {mappingForm.transformation_rules.length === 0 && (
                <p className="text-gray-500 text-center py-4">No transformations configured</p>
              )}
            </TabsContent>

            <TabsContent value="validations" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Data Validations</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newRule: ValidationRule = {
                      type: 'required',
                      parameters: {},
                      is_blocking: true
                    };
                    setMappingForm({
                      ...mappingForm,
                      validation_rules: [...mappingForm.validation_rules, newRule]
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Validation
                </Button>
              </div>

              {mappingForm.validation_rules.map((rule, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 items-end">
                      <div>
                        <Label>Validation Type</Label>
                        <Select
                          value={rule.type}
                          onValueChange={(value) => {
                            const newRules = [...mappingForm.validation_rules];
                            newRules[index] = { ...rule, type: value as ValidationRuleType };
                            setMappingForm({ ...mappingForm, validation_rules: newRules });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VALIDATION_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={rule.is_blocking}
                          onCheckedChange={(checked) => {
                            const newRules = [...mappingForm.validation_rules];
                            newRules[index] = { ...rule, is_blocking: checked };
                            setMappingForm({ ...mappingForm, validation_rules: newRules });
                          }}
                        />
                        <Label>Blocking</Label>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newRules = mappingForm.validation_rules.filter((_, i) => i !== index);
                          setMappingForm({ ...mappingForm, validation_rules: newRules });
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <Label>Error Message</Label>
                        <Input
                          placeholder="Custom error message"
                          value={rule.error_message || ''}
                          onChange={(e) => {
                            const newRules = [...mappingForm.validation_rules];
                            newRules[index] = { ...rule, error_message: e.target.value };
                            setMappingForm({ ...mappingForm, validation_rules: newRules });
                          }}
                        />
                      </div>

                      {(rule.type === 'min_length' || rule.type === 'max_length' || rule.type === 'pattern') && (
                        <div>
                          <Label>Parameters (JSON)</Label>
                          <Input
                            placeholder={rule.type === 'pattern' ? '{"regex": "^[0-9]+$"}' : '{"length": 5}'}
                            value={JSON.stringify(rule.parameters || {}, null, 2)}
                            onChange={(e) => {
                              try {
                                const params = JSON.parse(e.target.value);
                                const newRules = [...mappingForm.validation_rules];
                                newRules[index] = { ...rule, parameters: params };
                                setMappingForm({ ...mappingForm, validation_rules: newRules });
                              } catch {
                                // Invalid JSON, ignore
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {mappingForm.validation_rules.length === 0 && (
                <p className="text-gray-500 text-center py-4">No validations configured</p>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setShowEditDialog(false);
            }}>
              Cancel
            </Button>
            <Button onClick={showEditDialog ? handleEditMapping : handleCreateMapping}>
              {showEditDialog ? 'Update Mapping' : 'Create Mapping'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Field Mapping Templates</DialogTitle>
            <DialogDescription>
              Use predefined templates to quickly set up field mappings for common EHR systems.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      {template.entity_type && (
                        <Badge className={getEntityTypeColor(template.entity_type)}>
                          {ENTITY_TYPES.find(t => t.value === template.entity_type)?.label}
                        </Badge>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        {template.mappings.length} field mapping{template.mappings.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyTemplate(template)}
                    >
                      Apply Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {templates.length === 0 && (
              <p className="text-gray-500 text-center py-8">No templates available</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Results Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mapping Validation Results</DialogTitle>
          </DialogHeader>

          {validationResult && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {validationResult.is_valid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                <span className={validationResult.is_valid ? 'text-green-600' : 'text-red-600'}>
                  {validationResult.is_valid ? 'Validation Passed' : 'Validation Failed'}
                </span>
              </div>

              {validationResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-600">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-yellow-600 mb-2">Warnings:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-600">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.field_conflicts.length > 0 && (
                <div>
                  <h4 className="font-semibold text-orange-600 mb-2">Field Conflicts:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResult.field_conflicts.map((conflict, index) => (
                      <li key={index} className="text-sm text-orange-600">{conflict}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowValidationDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
