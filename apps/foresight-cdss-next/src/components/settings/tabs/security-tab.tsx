import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SecurityTabProps {
  validationSettings: {
    auditLogging?: {
      logRuleApplications?: boolean;
      logAutoFixes?: boolean;
      retentionPeriod?: string;
    };
  };
  onSettingChange: (key: string, value: any) => void;
}

export function SecurityTab({ validationSettings, onSettingChange }: Readonly<SecurityTabProps>) {
  const handleSettingChange = (key: string, value: any) => {
    onSettingChange(key, value);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Access Controls
        </h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Default User Role</Label>
            <Select defaultValue="PA Coordinator">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PA Coordinator">PA Coordinator</SelectItem>
                <SelectItem value="PA Reviewer">PA Reviewer</SelectItem>
                <SelectItem value="Administrator">Administrator</SelectItem>
                <SelectItem value="Read Only">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Require MFA</Label>
              <p className="text-sm text-muted-foreground">
                Require multi-factor authentication for all users
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Session Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Automatically log out inactive users
              </p>
            </div>
            <Select defaultValue="1 hour">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30 minutes">30 minutes</SelectItem>
                <SelectItem value="1 hour">1 hour</SelectItem>
                <SelectItem value="4 hours">4 hours</SelectItem>
                <SelectItem value="8 hours">8 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Audit & Compliance
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Enable Audit Logging</Label>
              <p className="text-sm text-muted-foreground">
                Track all user actions and system events
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">HIPAA Compliance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable additional privacy and security controls
              </p>
            </div>
            <Switch checked disabled />
          </div>

          {/* Detailed Audit Trail Configuration */}
          <div className="border-t pt-6 space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
              Detailed Audit Trail Configuration
            </h4>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Log All Rule Applications
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track when validation rules are applied and their outcomes
                </p>
              </div>
              <Switch
                checked={
                  validationSettings.auditLogging?.logRuleApplications || false
                }
                onCheckedChange={(checked) =>
                  handleSettingChange("auditLogging", {
                    ...validationSettings.auditLogging,
                    logRuleApplications: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Log Auto-Fix Actions
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Record all automatic corrections made to claims and ePAs
                </p>
              </div>
              <Switch
                checked={validationSettings.auditLogging?.logAutoFixes || false}
                onCheckedChange={(checked) =>
                  handleSettingChange("auditLogging", {
                    ...validationSettings.auditLogging,
                    logAutoFixes: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Audit Log Retention Period
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  How long to keep detailed audit trail records for compliance
                </p>
              </div>
              <Select
                value={
                  validationSettings.auditLogging?.retentionPeriod ?? "7years"
                }
                onValueChange={(value) =>
                  handleSettingChange("auditLogging", {
                    ...validationSettings.auditLogging,
                    retentionPeriod: value,
                  })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">30 days</SelectItem>
                  <SelectItem value="90days">90 days</SelectItem>
                  <SelectItem value="1year">1 year</SelectItem>
                  <SelectItem value="3years">3 years</SelectItem>
                  <SelectItem value="7years">7 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Original Data Retention Setting */}
          <div className="space-y-2 border-t pt-4">
            <Label>General Data Retention Period</Label>
            <Select defaultValue="7 years">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1 year">1 year</SelectItem>
                <SelectItem value="2 years">2 years</SelectItem>
                <SelectItem value="5 years">5 years</SelectItem>
                <SelectItem value="7 years">7 years</SelectItem>
                <SelectItem value="Indefinite">Indefinite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </div>
  );
}