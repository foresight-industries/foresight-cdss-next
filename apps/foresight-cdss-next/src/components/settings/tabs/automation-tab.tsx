import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AutomationSettings {
  autoApprovalThreshold: number;
  requireReviewThreshold: number;
  maxRetryAttempts: number;
  enableBulkProcessing: boolean;
  confidenceScoreEnabled: boolean;
  ocrAccuracyThreshold: number;
  globalConfidenceThreshold: number;
  enableAutoSubmission: boolean;
  enableAutoEPA: boolean;
  fieldConfidenceThresholds: {
    cptCode: number;
    icd10: number;
    placeOfService: number;
    modifiers: number;
  };
}

interface AutomationTabProps {
  automationSettings: AutomationSettings;
  onSettingChange: (key: string, value: any) => void;
}

export function AutomationTab({ automationSettings, onSettingChange }: AutomationTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Global Confidence Threshold
        </h3>
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Global Confidence Threshold
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Items below this threshold will surface for human review.
                  Higher percentage = stricter automation.
                </p>
              </div>
              <div className="flex items-center gap-4 min-w-[280px]">
                <Slider
                  value={[automationSettings.globalConfidenceThreshold || 88]}
                  onValueChange={(value) => onSettingChange("globalConfidenceThreshold", value[0])}
                  max={98}
                  min={60}
                  step={1}
                  className="flex-1"
                />
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums min-w-[3.5ch]">
                  {automationSettings.globalConfidenceThreshold || 88}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Auto-Submission Controls
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Enable Auto-Submission for Claims
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically submit claims that meet confidence threshold and
                pass all validation rules
              </p>
            </div>
            <Switch
              checked={automationSettings.enableAutoSubmission || false}
              onCheckedChange={(checked) => onSettingChange("enableAutoSubmission", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Enable Auto-Approval for ePAs
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically approve prior authorizations that meet confidence
                threshold
              </p>
            </div>
            <Switch
              checked={automationSettings.enableAutoEPA || false}
              onCheckedChange={(checked) => onSettingChange("enableAutoEPA", checked)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-8 mb-4">
          <div className="flex-1">
            <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Field-Level Confidence Minimums
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Minimum confidence required for individual fields before
              auto-submission
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-900 dark:text-slate-100">
                CPT Code
              </Label>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {automationSettings.fieldConfidenceThresholds?.cptCode || 85}%
              </span>
            </div>
            <Slider
              value={[automationSettings.fieldConfidenceThresholds?.cptCode || 85]}
              onValueChange={(value) => 
                onSettingChange("fieldConfidenceThresholds", {
                  ...automationSettings.fieldConfidenceThresholds,
                  cptCode: value[0]
                })
              }
              max={98}
              min={60}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-900 dark:text-slate-100">
                ICD-10 Code
              </Label>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {automationSettings.fieldConfidenceThresholds?.icd10 || 85}%
              </span>
            </div>
            <Slider
              value={[automationSettings.fieldConfidenceThresholds?.icd10 || 85]}
              onValueChange={(value) => 
                onSettingChange("fieldConfidenceThresholds", {
                  ...automationSettings.fieldConfidenceThresholds,
                  icd10: value[0]
                })
              }
              max={98}
              min={60}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-900 dark:text-slate-100">
                Place of Service
              </Label>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {automationSettings.fieldConfidenceThresholds?.placeOfService || 85}%
              </span>
            </div>
            <Slider
              value={[automationSettings.fieldConfidenceThresholds?.placeOfService || 85]}
              onValueChange={(value) => 
                onSettingChange("fieldConfidenceThresholds", {
                  ...automationSettings.fieldConfidenceThresholds,
                  placeOfService: value[0]
                })
              }
              max={98}
              min={60}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-900 dark:text-slate-100">
                Modifiers
              </Label>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {automationSettings.fieldConfidenceThresholds?.modifiers || 85}%
              </span>
            </div>
            <Slider
              value={[automationSettings.fieldConfidenceThresholds?.modifiers || 85]}
              onValueChange={(value) => 
                onSettingChange("fieldConfidenceThresholds", {
                  ...automationSettings.fieldConfidenceThresholds,
                  modifiers: value[0]
                })
              }
              max={98}
              min={60}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Processing Rules
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Enable Bulk Processing</Label>
              <p className="text-sm text-muted-foreground">
                Process multiple PAs simultaneously
              </p>
            </div>
            <Switch
              checked={automationSettings.enableBulkProcessing}
              onCheckedChange={(checked) =>
                onSettingChange("enableBulkProcessing", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Confidence Score Display</Label>
              <p className="text-sm text-muted-foreground">
                Show AI confidence scores in UI
              </p>
            </div>
            <Switch
              checked={automationSettings.confidenceScoreEnabled}
              onCheckedChange={(checked) =>
                onSettingChange("confidenceScoreEnabled", checked)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Max Retry Attempts</Label>
            <div className="w-full">
              <Select
                value={automationSettings.maxRetryAttempts.toString()}
                onValueChange={(value) =>
                  onSettingChange("maxRetryAttempts", Number(value))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 attempt</SelectItem>
                  <SelectItem value="2">2 attempts</SelectItem>
                  <SelectItem value="3">3 attempts</SelectItem>
                  <SelectItem value="5">5 attempts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}