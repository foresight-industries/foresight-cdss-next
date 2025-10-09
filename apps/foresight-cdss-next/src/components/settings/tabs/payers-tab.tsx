import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface PayerRule {
  id: string;
  payerName: string;
  ruleName: string;
  description: string;
  rules: string[];
  enabled: boolean;
}

interface FieldMapping {
  payer: string;
  field: string;
  mapping: string;
  enabled: boolean;
}

interface SpecialHandlingRules {
  autoRetryFailedClaims: boolean;
  priorityProcessingHighValue: boolean;
  batchProcessingMedicare: boolean;
}

interface PayersTabProps {
  payerRules?: PayerRule[];
  fieldMappings?: FieldMapping[];
  specialHandlingRules?: SpecialHandlingRules;
  onConfigurePayer?: (payerName: string) => void;
  onTogglePayerRule?: (ruleId: string, enabled: boolean) => void;
  onEditPayerRule?: (ruleId: string) => void;
  onAddPayerRule?: () => void;
  onToggleFieldMapping?: (index: number, enabled: boolean) => void;
  onEditFieldMapping?: (index: number) => void;
  onDeleteFieldMapping?: (index: number) => void;
  onAddFieldMapping?: () => void;
  onToggleSpecialRule?: (ruleKey: keyof SpecialHandlingRules, enabled: boolean) => void;
}

export function PayersTab({
  payerRules = [],
  fieldMappings = [],
  specialHandlingRules = {
    autoRetryFailedClaims: false,
    priorityProcessingHighValue: false,
    batchProcessingMedicare: false
  },
  onConfigurePayer,
  onTogglePayerRule,
  onEditPayerRule,
  onAddPayerRule,
  onToggleFieldMapping,
  onEditFieldMapping,
  onDeleteFieldMapping,
  onAddFieldMapping,
  onToggleSpecialRule
}: PayersTabProps) {
  const defaultPayers = [
    {
      name: "Aetna",
      status: "Connected",
      lastSync: "2 hours ago",
      claims: "1,234",
    },
    {
      name: "Blue Cross Blue Shield",
      status: "Connected",
      lastSync: "1 hour ago",
      claims: "2,847",
    },
    {
      name: "UnitedHealthcare",
      status: "Disconnected",
      lastSync: "Never",
      claims: "0",
    },
    {
      name: "Cigna",
      status: "Connected",
      lastSync: "30 minutes ago",
      claims: "892",
    },
    {
      name: "Medicare",
      status: "Connected",
      lastSync: "45 minutes ago",
      claims: "3,156",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Payer Connection Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Payer Connection Status
        </h3>
        <div className="space-y-4">
          {defaultPayers.map((payer) => (
            <div
              key={payer.name}
              className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-3 h-3 rounded-full ${
                    payer.status === "Connected" ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {payer.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Last sync: {payer.lastSync} • {payer.claims} claims
                    processed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    payer.status === "Connected" ? "default" : "secondary"
                  }
                >
                  {payer.status}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onConfigurePayer?.(payer.name)}
                >
                  Configure
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Payer-Specific Rules & Overrides */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Payer-Specific Rules & Overrides
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Configure custom validation rules and field mappings for specific
              payers
            </p>
          </div>
          <Button
            size="sm"
            onClick={onAddPayerRule}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Override Rule
          </Button>
        </div>

        <div className="space-y-4">
          {payerRules.map((rule) => (
            <div
              key={rule.id}
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) =>
                      onTogglePayerRule?.(rule.id, checked)
                    }
                  />
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      {rule.payerName} - {rule.ruleName}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {rule.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditPayerRule?.(rule.id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2 mt-3">
                <div
                  className={`text-xs ${
                    rule.enabled
                      ? "text-slate-700 dark:text-slate-300"
                      : "text-slate-500 dark:text-slate-500"
                  }`}
                >
                  <span className="font-medium">
                    {rule.enabled ? "Active Rules:" : "Rules (Disabled):"}
                  </span>
                </div>
                <div
                  className={`flex flex-wrap gap-2 ${
                    !rule.enabled ? "opacity-50" : ""
                  }`}
                >
                  {rule.rules.map((ruleName, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {ruleName}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Rules Message */}
        {payerRules.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg mt-4">
            <p className="text-sm font-medium">
              Need to add more payer-specific rules?
            </p>
            <p className="text-xs mt-1">
              Click &quot;Add Override Rule&quot; to create custom validation for
              specific payers
            </p>
          </div>
        )}
      </Card>

      {/* Field Mapping Overrides */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Field Mapping Overrides
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Customize how fields are mapped for different payers
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onAddFieldMapping}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Field Mapping
          </Button>
        </div>

        <div className="space-y-3">
          {fieldMappings.map((mapping, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Switch
                  checked={mapping.enabled}
                  onCheckedChange={(checked) =>
                    onToggleFieldMapping?.(index, checked)
                  }
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {mapping.payer} - {mapping.field}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {mapping.mapping}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditFieldMapping?.(index)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteFieldMapping?.(index)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Special Handling Rules */}
      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Special Handling Rules
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium text-slate-900 dark:text-slate-100">
                Auto-Retry Failed Claims
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Automatically retry claims that fail payer-specific validation
              </p>
            </div>
            <Switch
              checked={specialHandlingRules.autoRetryFailedClaims}
              onCheckedChange={(checked) =>
                onToggleSpecialRule?.("autoRetryFailedClaims", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium text-slate-900 dark:text-slate-100">
                Priority Processing for High-Value Claims
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Process claims over $500 with enhanced validation
              </p>
            </div>
            <Switch
              checked={specialHandlingRules.priorityProcessingHighValue}
              onCheckedChange={(checked) =>
                onToggleSpecialRule?.("priorityProcessingHighValue", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium text-slate-900 dark:text-slate-100">
                Batch Processing for Medicare
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Group Medicare claims for efficient batch submission
              </p>
            </div>
            <Switch
              checked={specialHandlingRules.batchProcessingMedicare}
              onCheckedChange={(checked) =>
                onToggleSpecialRule?.("batchProcessingMedicare", checked)
              }
            />
          </div>
        </div>
      </Card>

      {/* Supported Payers Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Supported Payers
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Medicare",
            "Medicaid",
            "Aetna",
            "Anthem",
            "Cigna",
            "UnitedHealthcare",
            "Humana",
            "BCBS",
          ].map((payer) => (
            <div
              key={payer}
              className="text-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <p className="font-medium text-sm">{payer}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Portal Integration
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
