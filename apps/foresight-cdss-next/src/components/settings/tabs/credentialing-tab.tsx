import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface CredentialingRules {
  enforceCredentialing?: boolean;
  multiStateLicensure?: boolean;
  showCredentialingAlerts?: boolean;
  allowedStatuses?: string[];
}

interface ValidationSettings {
  credentialingRules?: CredentialingRules;
}

interface CredentialingTabProps {
  validationSettings: ValidationSettings;
  onSettingChange: (key: string, value: any) => void;
}

export function CredentialingTab({ validationSettings, onSettingChange }: CredentialingTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Provider Credentialing Requirements
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="enforce-credentialing"
                className="font-medium text-slate-900 dark:text-slate-100"
              >
                Enforce Credentialing
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Require valid credentialing before submission
              </p>
            </div>
            <Switch
              id="enforce-credentialing"
              checked={
                validationSettings.credentialingRules?.enforceCredentialing ||
                false
              }
              onCheckedChange={(checked) =>
                onSettingChange("credentialingRules", {
                  ...validationSettings.credentialingRules,
                  enforceCredentialing: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="multi-state-licensure"
                className="font-medium text-slate-900 dark:text-slate-100"
              >
                Multi-State Licensure Validation (Telemedicine)
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Verify provider is licensed in patient's state of residence
              </p>
            </div>
            <Switch
              id="multi-state-licensure"
              checked={
                validationSettings.credentialingRules?.multiStateLicensure ||
                false
              }
              onCheckedChange={(checked) =>
                onSettingChange("credentialingRules", {
                  ...validationSettings.credentialingRules,
                  multiStateLicensure: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="credentialing-alerts"
                className="font-medium text-slate-900 dark:text-slate-100"
              >
                Credentialing Alerts
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Show alerts for credentialing issues
              </p>
            </div>
            <Switch
              id="credentialing-alerts"
              checked={
                validationSettings.credentialingRules
                  ?.showCredentialingAlerts || false
              }
              onCheckedChange={(checked) =>
                onSettingChange("credentialingRules", {
                  ...validationSettings.credentialingRules,
                  showCredentialingAlerts: checked,
                })
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Allowed Provider Statuses
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Select which provider credentialing statuses are allowed for claim
            submission
          </p>

          <div className="space-y-3">
            {["Active", "Pending", "Provisional", "Inactive", "Suspended"].map(
              (status) => (
                <label
                  key={status}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <Checkbox
                    checked={
                      validationSettings.credentialingRules?.allowedStatuses?.includes(
                        status
                      ) || false
                    }
                    onCheckedChange={(checked) => {
                      const currentStatuses =
                        validationSettings.credentialingRules
                          ?.allowedStatuses || [];
                      const updatedStatuses = checked
                        ? [...currentStatuses, status]
                        : currentStatuses.filter((s) => s !== status);

                      onSettingChange("credentialingRules", {
                        ...validationSettings.credentialingRules,
                        allowedStatuses: updatedStatuses,
                      });
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {status}
                    </span>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {status === "Active" &&
                        "Provider is fully credentialed and active"}
                      {status === "Pending" && "Credentialing is in progress"}
                      {status === "Provisional" &&
                        "Temporary credentialing status"}
                      {status === "Inactive" &&
                        "Provider is not currently active"}
                      {status === "Suspended" &&
                        "Provider privileges are suspended"}
                    </div>
                  </div>
                  {status === "Active" && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      Recommended
                    </Badge>
                  )}
                </label>
              )
            )}
          </div>

          {(!validationSettings.credentialingRules?.allowedStatuses ||
            validationSettings.credentialingRules.allowedStatuses.length ===
              0) && (
            <div className="text-center py-4 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium">
                No provider statuses selected
              </p>
              <p className="text-xs mt-1">
                Claims will be blocked until at least one status is allowed
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}