import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Clock } from 'lucide-react';
import { useState } from 'react';

interface CptRule {
  id: string;
  cptCode: string;
  description: string;
  minMinutes: number;
  maxMinutes: number;
  flagIfNotDocumented: boolean;
  enabled: boolean;
}

interface TimeBasedValidation {
  enabled?: boolean;
  extractTimeFromNotes?: boolean;
  cptRules?: CptRule[];
}

interface ValidationSettings {
  timeBasedValidation?: TimeBasedValidation;
}

interface TimeBasedTabProps {
  validationSettings: ValidationSettings;
  onSettingChange: (key: string, value: any) => void;
}

export function TimeBasedTab({
  validationSettings,
  onSettingChange
}: TimeBasedTabProps) {
  // CPT Rule Modal State
  const [showCptRuleModal, setShowCptRuleModal] = useState(false);
  const [cptRuleForm, setCptRuleForm] = useState({
    cptCode: "",
    description: "",
    minMinutes: 15,
    maxMinutes: 30,
    flagIfNotDocumented: true,
    enabled: true,
  });

  const handleAddCptRule = () => {
    setCptRuleForm({
      cptCode: "",
      description: "",
      minMinutes: 15,
      maxMinutes: 30,
      flagIfNotDocumented: true,
      enabled: true,
    });
    setShowCptRuleModal(true);
  };

  const handleSaveCptRule = () => {
    const newRule: CptRule = {
      id: `cpt-rule-${Date.now()}`,
      cptCode: cptRuleForm.cptCode,
      description: cptRuleForm.description,
      minMinutes: cptRuleForm.minMinutes,
      maxMinutes: cptRuleForm.maxMinutes,
      flagIfNotDocumented: cptRuleForm.flagIfNotDocumented,
      enabled: cptRuleForm.enabled,
    };

    const existingRules = validationSettings.timeBasedValidation?.cptRules || [];
    const updatedRules = [...existingRules, newRule];

    onSettingChange("timeBasedValidation", {
      ...validationSettings.timeBasedValidation,
      cptRules: updatedRules,
    });

    setShowCptRuleModal(false);
    setCptRuleForm({
      cptCode: "",
      description: "",
      minMinutes: 15,
      maxMinutes: 30,
      flagIfNotDocumented: true,
      enabled: true,
    });
  };

  const handleCptRuleFormChange = (key: string, value: any) => {
    setCptRuleForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateCptRule = (index: number, updates: Partial<CptRule>) => {
    const updatedRules = [...(validationSettings.timeBasedValidation?.cptRules || [])];
    updatedRules[index] = { ...updatedRules[index], ...updates };
    onSettingChange("timeBasedValidation", {
      ...validationSettings.timeBasedValidation,
      cptRules: updatedRules,
    });
  };

  const removeCptRule = (index: number) => {
    const updatedRules = (validationSettings.timeBasedValidation?.cptRules || []).filter((_, i) => i !== index);
    onSettingChange("timeBasedValidation", {
      ...validationSettings.timeBasedValidation,
      cptRules: updatedRules,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Label
            htmlFor="time-based-enabled"
            className="text-sm font-semibold text-slate-900 dark:text-slate-100"
          >
            Enable Time-Based Validation
          </Label>
          <Switch
            id="time-based-enabled"
            checked={validationSettings.timeBasedValidation?.enabled || false}
            onCheckedChange={(checked) =>
              onSettingChange("timeBasedValidation", {
                ...validationSettings.timeBasedValidation,
                enabled: checked,
              })
            }
          />
        </div>
        <label htmlFor="extract-time-ai" className="flex items-center gap-2">
          <Checkbox
            id="extract-time-ai"
            checked={
              validationSettings.timeBasedValidation?.extractTimeFromNotes ||
              false
            }
            onCheckedChange={(checked) =>
              onSettingChange("timeBasedValidation", {
                ...validationSettings.timeBasedValidation,
                extractTimeFromNotes: !!checked,
              })
            }
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Extract time documentation from clinical notes using AI
          </span>
        </label>
      </Card>

      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <Label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
            E/M Code Time Requirements
          </Label>
          <Button size="sm" onClick={handleAddCptRule}>
            <Plus className="w-4 h-4 mr-2" />
            Add CPT Rule
          </Button>
        </div>
        <div className="space-y-3">
          {(validationSettings.timeBasedValidation?.cptRules || []).map(
            (rule, index) => (
              <div
                key={rule.id}
                className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    CPT {rule.cptCode} - {rule.description}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) =>
                        updateCptRule(index, { enabled: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCptRule(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label
                    htmlFor={`cpt-${rule.id}-range`}
                    className="text-xs text-slate-600 dark:text-slate-400"
                  >
                    Time Range:
                  </Label>
                  <Input
                    id={`cpt-${rule.id}-min`}
                    type="number"
                    value={rule.minMinutes}
                    onChange={(e) =>
                      updateCptRule(index, {
                        minMinutes: Number(e.target.value),
                      })
                    }
                    min="0"
                    className="w-20 text-center text-sm"
                  />
                  <span className="text-slate-400">to</span>
                  <Input
                    id={`cpt-${rule.id}-max`}
                    type="number"
                    value={rule.maxMinutes}
                    onChange={(e) =>
                      updateCptRule(index, {
                        maxMinutes: Number(e.target.value),
                      })
                    }
                    min="0"
                    className="w-20 text-center text-sm"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    minutes
                  </span>
                </div>
                <label
                  htmlFor={`cpt-${rule.id}-flag`}
                  className="flex items-center gap-2 mt-3"
                >
                  <Checkbox
                    id={`cpt-${rule.id}-flag`}
                    checked={rule.flagIfNotDocumented}
                    onCheckedChange={(checked) =>
                      updateCptRule(index, { flagIfNotDocumented: !!checked })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    Flag for review if time not documented
                  </span>
                </label>
              </div>
            )
          )}

          {(!validationSettings.timeBasedValidation?.cptRules ||
            validationSettings.timeBasedValidation.cptRules.length === 0) && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No time-based CPT rules configured</p>
              <p className="text-xs mt-1">
                Click &quot;Add CPT Rule&quot; to create your first time-based
                validation rule
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* CPT Rule Modal */}
      <Dialog open={showCptRuleModal} onOpenChange={setShowCptRuleModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              Add Time-Based CPT Rule
            </DialogTitle>
            <DialogDescription>
              Configure time requirements for a specific CPT code.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpt-code">CPT Code</Label>
                <Input
                  id="cpt-code"
                  placeholder="e.g., 99213"
                  value={cptRuleForm.cptCode}
                  onChange={(e) =>
                    handleCptRuleFormChange("cptCode", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Office Visit, Level 3"
                  value={cptRuleForm.description}
                  onChange={(e) =>
                    handleCptRuleFormChange("description", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-minutes">Minimum Minutes</Label>
                <Input
                  id="min-minutes"
                  type="number"
                  min="1"
                  value={cptRuleForm.minMinutes}
                  onChange={(e) =>
                    handleCptRuleFormChange("minMinutes", Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-minutes">Maximum Minutes</Label>
                <Input
                  id="max-minutes"
                  type="number"
                  min="1"
                  value={cptRuleForm.maxMinutes}
                  onChange={(e) =>
                    handleCptRuleFormChange("maxMinutes", Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="flag-if-not-documented"
                checked={cptRuleForm.flagIfNotDocumented}
                onCheckedChange={(checked) =>
                  handleCptRuleFormChange("flagIfNotDocumented", !!checked)
                }
              />
              <Label htmlFor="flag-if-not-documented">
                Flag for review if time not documented
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={cptRuleForm.enabled}
                onCheckedChange={(checked) =>
                  handleCptRuleFormChange("enabled", checked)
                }
              />
              <Label htmlFor="enabled">Enable this rule</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCptRuleModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCptRule}
              disabled={!cptRuleForm.cptCode || !cptRuleForm.description}
            >
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
