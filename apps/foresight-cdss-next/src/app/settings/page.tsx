import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireTeamMembership } from '@/lib/team';
import SettingsClient from '@/components/settings/settings-client';

async function loadTeamSettings() {
  try {
    const membership = await requireTeamMembership();
    const supabase = await createSupabaseServerClient();

    // Get all settings for the team
    const { data: settings, error } = await supabase
      .from('team_settings')
      .select('key, value')
      .eq('team_id', membership.team_id);

    if (error) {
      console.error('Error fetching team settings:', error);
      return { automation: {}, notifications: {} };
    }

    // Convert array of settings to object
    const settingsMap = settings?.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>) || {};

    return settingsMap;
  } catch (error) {
    console.error('Settings fetch error:', error);
    return { automation: {}, notifications: {} };
  }
}

export default async function SettingsPage() {
  const settingsData = await loadTeamSettings();

  // Default automation settings
  const defaultAutomationSettings = {
    autoApprovalThreshold: 90,
    requireReviewThreshold: 70,
    maxRetryAttempts: 3,
    enableBulkProcessing: true,
    confidenceScoreEnabled: true,
    ocrAccuracyThreshold: 95
  };

  // Default notification settings
  const defaultNotificationSettings = {
    emailAlerts: true,
    slackIntegration: false,
    approvalNotifications: true,
    denialNotifications: true,
    systemMaintenanceAlerts: true,
    weeklyReports: true,
    dailyDigest: false
  };

  // Merge with loaded settings
  const automationSettings = {
    ...defaultAutomationSettings,
    ...(settingsData.automation || {})
  };

  const notificationSettings = {
    ...defaultNotificationSettings,
    ...(settingsData.notifications || {})
  };

  return (
    <SettingsClient
      initialAutomationSettings={automationSettings}
      initialNotificationSettings={notificationSettings}
    />
  );
}
