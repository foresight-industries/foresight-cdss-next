import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

interface RequiredFieldsSettings {
  blockOnMissingFields?: boolean;
}

interface ValidationSettings {
  requiredFields?: RequiredFieldsSettings;
}

interface RequiredFieldsTabProps {
  validationSettings: ValidationSettings;
  onSettingChange: (key: string, value: any) => void;
}

export function RequiredFieldsTab({ validationSettings, onSettingChange }: RequiredFieldsTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Claims - Required Fields
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                CPT Code (Procedure)
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                ICD-10 Code (Diagnosis)
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Place of Service (POS)
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Service Date (DOS)
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Rendering Provider NPI
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Payer Information
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={true}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Modifiers
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800"
            >
              Conditionally Required
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Prior Authorization (ePA) - Required Fields
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Medication / Service Requested
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Clinical Indication / Diagnosis
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              Always Required
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={true}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Prior Therapies Documented (Step Therapy)
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800"
            >
              Conditionally Required
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Block Submission on Missing Required Fields
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Prevent auto-submission when any required field is missing or
              below confidence threshold
            </p>
          </div>
          <Switch
            checked={
              validationSettings.requiredFields?.blockOnMissingFields || false
            }
            onCheckedChange={(checked) =>
              onSettingChange("requiredFields", {
                ...validationSettings.requiredFields,
                blockOnMissingFields: checked,
              })
            }
          />
        </div>
      </Card>
    </div>
  );
}