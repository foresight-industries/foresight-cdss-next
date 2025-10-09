import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, FileText } from 'lucide-react';
import { useState } from 'react';

interface CustomRule {
  id: string;
  code: string;
  description: string;
  strategy: string;
  enabled: boolean;
  autoFix: boolean;
}

interface DenialPlaybook {
  autoRetryEnabled?: boolean;
  maxRetryAttempts?: number;
  customRules?: CustomRule[];
}

interface ValidationSettings {
  denialPlaybook?: DenialPlaybook;
}

interface DenialPlaybookTabProps {
  validationSettings: ValidationSettings;
  onSettingChange: (key: string, value: any) => void;
}

export function DenialPlaybookTab({
  validationSettings,
  onSettingChange
}: DenialPlaybookTabProps) {
  // Built-in denial rules (could be moved to parent state later)
  const [builtInDenialRules] = useState({
    carc96: { enabled: true },
    carc11: { enabled: true, autoFix: false },
    carc197: { enabled: true, autoFix: true }
  });

  // Custom Rule Modal State
  const [showCustomRuleDialog, setShowCustomRuleDialog] = useState(false);
  const [customRuleForm, setCustomRuleForm] = useState({
    code: "",
    description: "",
    strategy: "",
    autoFix: false,
    enabled: true,
  });

  const handleAddCustomRule = () => {
    setCustomRuleForm({
      code: "",
      description: "",
      strategy: "",
      autoFix: false,
      enabled: true,
    });
    setShowCustomRuleDialog(true);
  };

  const handleSaveCustomRule = () => {
    const newRule: CustomRule = {
      id: `custom-rule-${Date.now()}`,
      code: customRuleForm.code,
      description: customRuleForm.description,
      strategy: customRuleForm.strategy,
      autoFix: customRuleForm.autoFix,
      enabled: customRuleForm.enabled,
    };

    const existingRules = validationSettings.denialPlaybook?.customRules || [];
    const updatedRules = [...existingRules, newRule];

    onSettingChange("denialPlaybook", {
      ...validationSettings.denialPlaybook,
      customRules: updatedRules,
    });

    setShowCustomRuleDialog(false);
    setCustomRuleForm({
      code: "",
      description: "",
      strategy: "",
      autoFix: false,
      enabled: true,
    });
  };

  const handleCustomRuleFormChange = (key: string, value: any) => {
    setCustomRuleForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateCustomRule = (index: number, updates: Partial<CustomRule>) => {
    const updatedRules = [...(validationSettings.denialPlaybook?.customRules || [])];
    updatedRules[index] = { ...updatedRules[index], ...updates };
    onSettingChange("denialPlaybook", {
      ...validationSettings.denialPlaybook,
      customRules: updatedRules,
    });
  };

  const removeCustomRule = (index: number) => {
    const updatedRules = (validationSettings.denialPlaybook?.customRules || []).filter((_, i) => i !== index);
    onSettingChange("denialPlaybook", {
      ...validationSettings.denialPlaybook,
      customRules: updatedRules,
    });
  };

  const updateBuiltInRule = (ruleKey: string, updates: any) => {
    // For now, just console.log since built-in rules are local state
    // In a real app, this would update parent state
    console.log('Update built-in rule:', ruleKey, updates);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Auto-Retry Configuration
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="auto-retry-enabled"
                className="font-medium text-slate-900 dark:text-slate-100"
              >
                Enable Auto-Retry on Denials
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Automatically fix and resubmit based on denial codes
              </p>
            </div>
            <Switch
              id="auto-retry-enabled"
              checked={
                validationSettings.denialPlaybook?.autoRetryEnabled || false
              }
              onCheckedChange={(checked) =>
                onSettingChange("denialPlaybook", {
                  ...validationSettings.denialPlaybook,
                  autoRetryEnabled: checked,
                })
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-8">
          <div>
            <Label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Maximum Retry Attempts
            </Label>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              How many times to auto-retry before requiring human review
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="1"
              max="10"
              value={validationSettings.denialPlaybook?.maxRetryAttempts || 3}
              onChange={(e) =>
                onSettingChange("denialPlaybook", {
                  ...validationSettings.denialPlaybook,
                  maxRetryAttempts: Number(e.target.value),
                })
              }
              className="w-20 text-center"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              attempts
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Denial Code Auto-Fix Rules (CARC/RARC)
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddCustomRule}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Rule
          </Button>
        </div>

        <div className="space-y-3">
          {/* Display custom rules */}
          {(validationSettings.denialPlaybook?.customRules || []).map(
            (rule, index) => (
              <div
                key={rule.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {rule.code} - {rule.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) =>
                        updateCustomRule(index, { enabled: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomRule(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded p-3 space-y-2 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Strategy:</span>{" "}
                    {rule.strategy}
                  </div>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={rule.autoFix}
                      onCheckedChange={(checked) =>
                        updateCustomRule(index, { autoFix: !!checked })
                      }
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      Enable auto-fix for this denial code
                    </span>
                  </label>
                </div>
              </div>
            )
          )}

          {/* Built-in rules */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  CARC 96 - POS Inconsistent / Missing Modifier
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Success Rate:
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    87%
                  </span>
                </div>
              </div>
              <Switch
                checked={builtInDenialRules.carc96.enabled}
                onCheckedChange={(checked) =>
                  updateBuiltInRule("carc96", { enabled: checked })
                }
              />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded p-3 space-y-2 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-medium">Strategy:</span> Set POS to 10,
                Add Modifier 95, Add documentation note
              </div>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={true}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Enable auto-fix for this denial code
                </span>
              </label>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  CARC 11 - Diagnosis Inconsistent with Procedure
                </div>
              </div>
              <Switch
                checked={builtInDenialRules.carc11.enabled}
                onCheckedChange={(checked) =>
                  updateBuiltInRule("carc11", { enabled: checked })
                }
              />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded p-3 space-y-2 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-medium">Strategy:</span> Generate top 3
                ICD-10 alternatives, require human selection
              </div>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={builtInDenialRules.carc11.autoFix}
                  onCheckedChange={(checked) =>
                    updateBuiltInRule("carc11", { autoFix: !!checked })
                  }
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Surface for human review (do not auto-fix)
                </span>
              </label>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  CARC 197 - Precertification/Authorization Absent
                </div>
              </div>
              <Switch
                checked={builtInDenialRules.carc197.enabled}
                onCheckedChange={(checked) =>
                  updateBuiltInRule("carc197", { enabled: checked })
                }
              />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded p-3 space-y-2 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-medium">Strategy:</span> Check for
                existing PA, attach if found, otherwise initiate ePA workflow
              </div>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={builtInDenialRules.carc197.autoFix}
                  onCheckedChange={(checked) =>
                    updateBuiltInRule("carc197", { autoFix: !!checked })
                  }
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Automatically initiate ePA workflow when PA missing
                </span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Custom Denial Rule Modal */}
      <Dialog open={showCustomRuleDialog} onOpenChange={setShowCustomRuleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              Add Custom Denial Rule
            </DialogTitle>
            <DialogDescription>
              Create a custom rule for handling specific CARC/RARC denial codes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="denial-code">Denial Code</Label>
                <Input
                  id="denial-code"
                  placeholder="e.g., CARC 100"
                  value={customRuleForm.code}
                  onChange={(e) =>
                    handleCustomRuleFormChange("code", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Invalid Diagnosis"
                  value={customRuleForm.description}
                  onChange={(e) =>
                    handleCustomRuleFormChange("description", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy">Resolution Strategy</Label>
              <Textarea
                id="strategy"
                placeholder="Describe the strategy for resolving this denial..."
                value={customRuleForm.strategy}
                onChange={(e) =>
                  handleCustomRuleFormChange("strategy", e.target.value)
                }
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-fix"
                checked={customRuleForm.autoFix}
                onCheckedChange={(checked) =>
                  handleCustomRuleFormChange("autoFix", !!checked)
                }
              />
              <Label htmlFor="auto-fix">
                Enable auto-fix for this denial code
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={customRuleForm.enabled}
                onCheckedChange={(checked) =>
                  handleCustomRuleFormChange("enabled", checked)
                }
              />
              <Label htmlFor="enabled">Enable this rule</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCustomRuleDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCustomRule}
              disabled={!customRuleForm.code || !customRuleForm.description || !customRuleForm.strategy}
            >
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
