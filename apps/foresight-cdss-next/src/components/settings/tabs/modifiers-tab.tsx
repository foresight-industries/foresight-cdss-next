import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Code2 } from 'lucide-react';
import { useState } from 'react';

interface ModifierRules {
  modifier95Required?: boolean;
  autoAddModifier95?: boolean;
  modifier95ConflictResolution?: boolean;
  validateModifierCombinations?: boolean;
  requireModifierDocumentation?: boolean;
  blockInvalidModifiers?: boolean;
  enablePayerSpecificRules?: boolean;
  conflictRules?: Array<{
    id: string;
    name: string;
    conflictingModifiers: string[];
    resolution: string;
    description?: string;
    enabled: boolean;
  }>;
}

interface ValidationSettings {
  modifierRules?: ModifierRules;
}

interface ModifiersTabProps {
  validationSettings: ValidationSettings;
  onSettingChange: (key: string, value: any) => void;
}

export function ModifiersTab({
  validationSettings,
  onSettingChange
}: ModifiersTabProps) {
  // Conflict Rule Modal State
  const [showConflictRuleModal, setShowConflictRuleModal] = useState(false);
  const [editingConflictRule, setEditingConflictRule] = useState<string | null>(null);
  const [conflictRuleForm, setConflictRuleForm] = useState({
    name: "",
    conflictingModifiers: "",
    resolution: "flag",
    description: "",
    enabled: true,
  });

  const handleAddConflictRule = () => {
    setEditingConflictRule(null);
    setConflictRuleForm({
      name: "",
      conflictingModifiers: "",
      resolution: "flag",
      description: "",
      enabled: true,
    });
    setShowConflictRuleModal(true);
  };

  const handleEditConflictRule = (rule: any) => {
    setEditingConflictRule(rule.id);
    setConflictRuleForm({
      name: rule.name,
      conflictingModifiers: rule.conflictingModifiers.join(", "),
      resolution: rule.resolution,
      description: rule.description || "",
      enabled: rule.enabled,
    });
    setShowConflictRuleModal(true);
  };

  const handleSaveConflictRule = () => {
    const newRule = {
      id: editingConflictRule || `conflict-rule-${Date.now()}`,
      name: conflictRuleForm.name,
      conflictingModifiers: conflictRuleForm.conflictingModifiers
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m.length > 0),
      resolution: conflictRuleForm.resolution,
      description: conflictRuleForm.description,
      enabled: conflictRuleForm.enabled,
    };

    const existingRules = validationSettings.modifierRules?.conflictRules || [];
    let updatedRules;

    if (editingConflictRule) {
      // Edit existing rule
      const index = existingRules.findIndex((r) => r.id === editingConflictRule);
      if (index !== -1) {
        updatedRules = [...existingRules];
        updatedRules[index] = newRule;
      } else {
        updatedRules = [...existingRules, newRule];
      }
    } else {
      // Add new rule
      updatedRules = [...existingRules, newRule];
    }

    onSettingChange("modifierRules", {
      ...validationSettings.modifierRules,
      conflictRules: updatedRules,
    });

    setShowConflictRuleModal(false);
    setEditingConflictRule(null);
    setConflictRuleForm({
      name: "",
      conflictingModifiers: "",
      resolution: "flag",
      description: "",
      enabled: true,
    });
  };

  const handleConflictRuleFormChange = (key: string, value: any) => {
    setConflictRuleForm((prev) => ({ ...prev, [key]: value }));
  };
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Modifier 95 Rules
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Require Modifier 95 for Telehealth
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically enforce Modifier 95 requirement for all telehealth
                visits
              </p>
            </div>
            <Switch
              checked={
                validationSettings.modifierRules?.modifier95Required || false
              }
              onCheckedChange={(checked) =>
                onSettingChange("modifierRules", {
                  ...validationSettings.modifierRules,
                  modifier95Required: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Auto-Add Modifier 95
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically add Modifier 95 to telehealth claims when missing
              </p>
            </div>
            <Switch
              checked={
                validationSettings.modifierRules?.autoAddModifier95 || false
              }
              onCheckedChange={(checked) =>
                onSettingChange("modifierRules", {
                  ...validationSettings.modifierRules,
                  autoAddModifier95: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Modifier 95 Conflict Resolution
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically resolve conflicts when Modifier 95 is already
                present
              </p>
            </div>
            <Switch
              checked={
                validationSettings.modifierRules
                  ?.modifier95ConflictResolution || false
              }
              onCheckedChange={(checked) =>
                onSettingChange("modifierRules", {
                  ...validationSettings.modifierRules,
                  modifier95ConflictResolution: checked,
                })
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          General Modifier Validation
        </h3>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 block">
                Validation Rules
              </Label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                  <Checkbox
                    checked={
                      validationSettings.modifierRules
                        ?.validateModifierCombinations || false
                    }
                    onCheckedChange={(checked) =>
                      onSettingChange("modifierRules", {
                        ...validationSettings.modifierRules,
                        validateModifierCombinations: !!checked,
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Validate Modifier Combinations
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Check for invalid or conflicting modifier combinations
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                  <Checkbox
                    checked={
                      validationSettings.modifierRules
                        ?.requireModifierDocumentation || false
                    }
                    onCheckedChange={(checked) =>
                      onSettingChange("modifierRules", {
                        ...validationSettings.modifierRules,
                        requireModifierDocumentation: !!checked,
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Require Modifier Documentation
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Ensure clinical notes support the use of specific
                      modifiers
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                  <Checkbox
                    checked={
                      validationSettings.modifierRules?.blockInvalidModifiers ||
                      false
                    }
                    onCheckedChange={(checked) =>
                      onSettingChange("modifierRules", {
                        ...validationSettings.modifierRules,
                        blockInvalidModifiers: !!checked,
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Block Invalid Modifiers
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Prevent submission of claims with invalid modifier codes
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Custom Conflict Resolution Rules
          </h3>
          <Button
            size="sm"
            onClick={handleAddConflictRule}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>

        <div className="space-y-3">
          {(validationSettings.modifierRules?.conflictRules || []).map(
            (rule, index) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => {
                        const updatedRules = [
                          ...(validationSettings.modifierRules?.conflictRules ||
                            []),
                        ];
                        updatedRules[index] = { ...rule, enabled: checked };
                        onSettingChange("modifierRules", {
                          ...validationSettings.modifierRules,
                          conflictRules: updatedRules,
                        });
                      }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {rule.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Conflicts: {rule.conflictingModifiers.join(", ")} •
                        Resolution: {rule.resolution.replace("_", " ")}
                      </p>
                      {rule.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {rule.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditConflictRule(rule)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updatedRules = (
                        validationSettings.modifierRules?.conflictRules || []
                      ).filter((_, i) => i !== index);
                      onSettingChange("modifierRules", {
                        ...validationSettings.modifierRules,
                        conflictRules: updatedRules,
                      });
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            )
          )}

          {(!validationSettings.modifierRules?.conflictRules ||
            validationSettings.modifierRules.conflictRules.length === 0) && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No conflict resolution rules configured</p>
              <p className="text-xs mt-1">
                Click &quot;Add Rule&quot; to create your first conflict
                resolution rule
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Payer-Specific Modifier Rules
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Enable Payer-Specific Rules
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Apply different modifier rules based on insurance payer
                requirements
              </p>
            </div>
            <Switch
              checked={
                validationSettings.modifierRules?.enablePayerSpecificRules ||
                false
              }
              onCheckedChange={(checked) =>
                onSettingChange("modifierRules", {
                  ...validationSettings.modifierRules,
                  enablePayerSpecificRules: checked,
                })
              }
            />
          </div>

          {validationSettings.modifierRules?.enablePayerSpecificRules && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Payer-Specific Configuration
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Configure payer-specific modifier rules in the{" "}
                    <strong>Payer Configuration</strong> section. This setting
                    enables the enforcement of those rules during claim
                    validation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Conflict Rule Modal */}
      <Dialog
        open={showConflictRuleModal}
        onOpenChange={setShowConflictRuleModal}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Code2 className="w-5 h-5 mr-2 text-primary" />
              {editingConflictRule ? "Edit Conflict Rule" : "Add Conflict Rule"}
            </DialogTitle>
            <DialogDescription>
              Define how to handle conflicting modifier combinations
              automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule Name</Label>
              <Input
                id="rule-name"
                placeholder="e.g., Telehealth Modifier Conflict"
                value={conflictRuleForm.name}
                onChange={(e) =>
                  handleConflictRuleFormChange("name", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conflicting-modifiers">
                Conflicting Modifiers
              </Label>
              <Input
                id="conflicting-modifiers"
                placeholder="e.g., 95, GT, 02 (comma-separated)"
                value={conflictRuleForm.conflictingModifiers}
                onChange={(e) =>
                  handleConflictRuleFormChange(
                    "conflictingModifiers",
                    e.target.value
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Enter modifier codes separated by commas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution Action</Label>
              <Select
                value={conflictRuleForm.resolution}
                onValueChange={(value) =>
                  handleConflictRuleFormChange("resolution", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flag">Flag for Review</SelectItem>
                  <SelectItem value="auto_fix">Auto-Fix</SelectItem>
                  <SelectItem value="block">Block Submission</SelectItem>
                  <SelectItem value="prioritize">Prioritize 95</SelectItem>
                  <SelectItem value="remove_conflicts">
                    Remove Conflicting
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional context about this rule..."
                value={conflictRuleForm.description}
                onChange={(e) =>
                  handleConflictRuleFormChange("description", e.target.value)
                }
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={conflictRuleForm.enabled}
                onCheckedChange={(checked) =>
                  handleConflictRuleFormChange("enabled", checked)
                }
              />
              <Label htmlFor="enabled">Enable this rule</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConflictRuleModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveConflictRule}
              disabled={!conflictRuleForm.name || !conflictRuleForm.conflictingModifiers}
            >
              {editingConflictRule ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
