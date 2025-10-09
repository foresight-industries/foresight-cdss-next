import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface NotificationSettings {
  emailAlerts: boolean;
  slackIntegration: boolean;
  approvalNotifications: boolean;
  denialNotifications: boolean;
  systemMaintenanceAlerts: boolean;
  weeklyReports: boolean;
  dailyDigest: boolean;
}

interface NotificationsTabProps {
  notificationSettings: NotificationSettings;
  onSettingChange: (key: string, value: any) => void;
}

export function NotificationsTab({ notificationSettings, onSettingChange }: NotificationsTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Alert Preferences
        </h3>
        <div className="space-y-4">
          {[
            {
              key: "emailAlerts",
              label: "Email Alerts",
              description: "Receive notifications via email",
            },
            {
              key: "approvalNotifications",
              label: "Approval Notifications",
              description: "Get notified when PAs are approved",
            },
            {
              key: "denialNotifications",
              label: "Denial Notifications",
              description: "Get notified when PAs are denied",
            },
            {
              key: "systemMaintenanceAlerts",
              label: "System Maintenance",
              description: "Alerts for system updates and maintenance",
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <Switch
                checked={
                  notificationSettings[
                    item.key as keyof typeof notificationSettings
                  ]
                }
                onCheckedChange={(checked) => onSettingChange(item.key, checked)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Reports & Digests
        </h3>
        <div className="space-y-4">
          {[
            {
              key: "weeklyReports",
              label: "Weekly Reports",
              description: "Comprehensive weekly performance reports",
            },
            {
              key: "dailyDigest",
              label: "Daily Digest",
              description: "Daily summary of PA activity",
            },
            {
              key: "slackIntegration",
              label: "Slack Integration",
              description: "Send notifications to Slack channels",
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <Switch
                checked={
                  notificationSettings[
                    item.key as keyof typeof notificationSettings
                  ]
                }
                onCheckedChange={(checked) => onSettingChange(item.key, checked)}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}