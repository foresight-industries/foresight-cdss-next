import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface ValidationSettings {
  visitTypes: {
    telehealth: boolean;
    inPerson: boolean;
    home: boolean;
  };
  posRules: {
    enforceTelehealthPOS: boolean;
    enforceInPersonPOS: boolean;
    enforceHomePOS: boolean;
  };
}

interface VisitTypesTabProps {
  validationSettings: ValidationSettings;
  onSettingChange: (key: string, value: any) => void;
}

export function VisitTypesTab({ validationSettings, onSettingChange }: VisitTypesTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Supported Visit Types
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
            <Checkbox
              checked={validationSettings.visitTypes?.telehealth || false}
              onCheckedChange={(checked) =>
                onSettingChange("visitTypes", {
                  ...validationSettings.visitTypes,
                  telehealth: !!checked,
                })
              }
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Telemedicine / Telehealth
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Remote video visits with patients
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
            <Checkbox
              checked={validationSettings.visitTypes?.inPerson || false}
              onCheckedChange={(checked) =>
                onSettingChange("visitTypes", {
                  ...validationSettings.visitTypes,
                  inPerson: !!checked,
                })
              }
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                In-Person / Office Visits
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Patient visits your office location
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
            <Checkbox
              checked={validationSettings.visitTypes?.home || false}
              onCheckedChange={(checked) =>
                onSettingChange("visitTypes", {
                  ...validationSettings.visitTypes,
                  home: !!checked,
                })
              }
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Home Visits
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Provider visits patient at home
              </div>
            </div>
          </label>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Place of Service (POS) Enforcement
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Enforce Telehealth POS Codes
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Require POS 02 (telehealth) for virtual visits
              </p>
            </div>
            <Checkbox
              checked={validationSettings.posRules?.enforceTelehealthPOS || false}
              onCheckedChange={(checked) =>
                onSettingChange("posRules", {
                  ...validationSettings.posRules,
                  enforceTelehealthPOS: !!checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Enforce In-Person POS Codes
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Require POS 11 (office) for in-person visits
              </p>
            </div>
            <Checkbox
              checked={validationSettings.posRules?.enforceInPersonPOS || false}
              onCheckedChange={(checked) =>
                onSettingChange("posRules", {
                  ...validationSettings.posRules,
                  enforceInPersonPOS: !!checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Enforce Home Visit POS Codes
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Require POS 12 (home) for home visits
              </p>
            </div>
            <Checkbox
              checked={validationSettings.posRules?.enforceHomePOS || false}
              onCheckedChange={(checked) =>
                onSettingChange("posRules", {
                  ...validationSettings.posRules,
                  enforceHomePOS: !!checked,
                })
              }
            />
          </div>
        </div>
      </Card>
    </div>
  );
}