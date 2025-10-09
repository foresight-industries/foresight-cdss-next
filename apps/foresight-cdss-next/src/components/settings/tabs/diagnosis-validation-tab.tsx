import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

interface DiagnosisValidation {
  validateIcdToCpt?: boolean;
  medicalNecessityThreshold?: number;
  suggestAlternativeDx?: boolean;
}

interface ValidationSettings {
  diagnosisValidation?: DiagnosisValidation;
}

interface DiagnosisValidationTabProps {
  validationSettings: ValidationSettings;
  onSettingChange: (key: string, value: any) => void;
}

export function DiagnosisValidationTab({ validationSettings, onSettingChange }: DiagnosisValidationTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          ICD-10 to CPT Validation
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Validate ICD-10 to CPT Compatibility
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Check that diagnosis codes support medical necessity for
                procedures
              </p>
            </div>
            <Switch
              checked={
                validationSettings.diagnosisValidation?.validateIcdToCpt ||
                false
              }
              onCheckedChange={(checked) =>
                onSettingChange("diagnosisValidation", {
                  ...validationSettings.diagnosisValidation,
                  validateIcdToCpt: checked,
                })
              }
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Medical Necessity Confidence Threshold
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI confidence required for diagnosis-procedure pairing to be
                  accepted
                </p>
              </div>
              <div className="flex items-center gap-4 min-w-[280px]">
                <Slider
                  value={[
                    validationSettings.diagnosisValidation
                      ?.medicalNecessityThreshold || 80,
                  ]}
                  onValueChange={([value]) =>
                    onSettingChange("diagnosisValidation", {
                      ...validationSettings.diagnosisValidation,
                      medicalNecessityThreshold: value,
                    })
                  }
                  min={60}
                  max={98}
                  step={1}
                  className="flex-1"
                />
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums min-w-[3.5ch]">
                  {validationSettings.diagnosisValidation
                    ?.medicalNecessityThreshold || 80}
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Suggest Alternative Diagnoses
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When diagnosis doesn&apos;t match procedure, suggest compatible
                alternatives using AI
              </p>
            </div>
            <Switch
              checked={
                validationSettings.diagnosisValidation?.suggestAlternativeDx ||
                false
              }
              onCheckedChange={(checked) =>
                onSettingChange("diagnosisValidation", {
                  ...validationSettings.diagnosisValidation,
                  suggestAlternativeDx: checked,
                })
              }
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
