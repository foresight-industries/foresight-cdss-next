'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Save, Bell, Shield, Database, Zap, Users, AlertTriangle, CheckCircle, Mail, UserPlus, Edit, Globe, Webhook, CreditCard, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import Link from "next/link";

interface SettingsSection {
  id: string;
  title: string;
  icon: any;
  description: string;
}

interface SettingsProps {
  initialAutomationSettings: {
    autoApprovalThreshold: number;
    requireReviewThreshold: number;
    maxRetryAttempts: number;
    enableBulkProcessing: boolean;
    confidenceScoreEnabled: boolean;
    ocrAccuracyThreshold: number;
  };
  initialNotificationSettings: {
    emailAlerts: boolean;
    slackIntegration: boolean;
    approvalNotifications: boolean;
    denialNotifications: boolean;
    systemMaintenanceAlerts: boolean;
    weeklyReports: boolean;
    dailyDigest: boolean;
  };
}

const settingsSections: SettingsSection[] = [
  {
    id: 'automation',
    title: 'Automation Rules',
    icon: Zap,
    description: 'Configure PA automation thresholds and rules'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Manage alerts and notification preferences'
  },
  {
    id: 'ehr',
    title: 'EHR Integration',
    icon: Globe,
    description: 'Electronic Health Record system connections'
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    icon: Webhook,
    description: 'Real-time data synchronization webhooks'
  },
  {
    id: 'payers',
    title: 'Payer Configuration',
    icon: CreditCard,
    description: 'Manage insurance payer configurations'
  },
  {
    id: 'field-mappings',
    title: 'Field Mappings',
    icon: Settings,
    description: 'Configure custom field mapping rules'
  },
  {
    id: 'integrations',
    title: 'Other Integrations',
    icon: Database,
    description: 'API connections and data sync settings'
  },
  {
    id: 'security',
    title: 'Security & Access',
    icon: Shield,
    description: 'User permissions and security settings'
  },
  {
    id: 'users',
    title: 'User Management',
    icon: Users,
    description: 'Manage team members and roles'
  }
];

function SettingsPageContent({ initialAutomationSettings, initialNotificationSettings }: SettingsProps) {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState('automation');
  const [hasChanges, setHasChanges] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'PA Coordinator',
    sendWelcomeEmail: true
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<{index: number; name: string; email: string; role: string; status: string} | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'PA Coordinator',
    status: 'Active'
  });

  const [automationSettings, setAutomationSettings] = useState(initialAutomationSettings);
  const [notificationSettings, setNotificationSettings] = useState(initialNotificationSettings);

  const [teamMembers, setTeamMembers] = useState([
    { name: 'Jane Doe', email: 'jane@foresight.health', role: 'Administrator', status: 'Active' },
    { name: 'John Smith', email: 'john@foresight.health', role: 'PA Coordinator', status: 'Active' },
    { name: 'Sarah Wilson', email: 'sarah@foresight.health', role: 'PA Reviewer', status: 'Pending' }
  ]);

  const [integrationStatus] = useState({
    cmm: { connected: true, lastSync: '2 minutes ago', status: 'healthy' },
    supabase: { connected: true, lastSync: 'Real-time', status: 'healthy' },
    gemini: { connected: true, lastSync: '1 minute ago', status: 'healthy' },
    webhooks: { connected: true, lastSync: '30 seconds ago', status: 'healthy' }
  });

  // Handle URL parameters to navigate to specific sections
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && settingsSections.some(s => s.id === section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const handleSave = async () => {
    try {
      const settingsToSave = {
        automation: automationSettings,
        notifications: notificationSettings
      };

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: settingsToSave })
      });

      if (response.ok) {
        setHasChanges(false);
        // TODO: Show success toast notification
        console.log('Settings saved successfully');
      } else {
        // TODO: Show error toast notification
        console.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      // TODO: Show error toast notification
    }
  };

  const handleSettingChange = (section: string, key: string, value: any) => {
    setHasChanges(true);
    if (section === 'automation') {
      setAutomationSettings(prev => ({ ...prev, [key]: value }));
    } else if (section === 'notifications') {
      setNotificationSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleInviteUser = () => {
    // In real implementation, this would call API to send invitation
    console.log('Inviting user:', inviteForm);

    // Reset form and close modal
    setInviteForm({
      email: '',
      firstName: '',
      lastName: '',
      role: 'PA Coordinator',
      sendWelcomeEmail: true
    });
    setShowInviteModal(false);

    // Show success message (in real app, this would be a toast notification)
    alert(`Invitation sent to ${inviteForm.email}`);
  };

  const handleInviteFormChange = (key: string, value: any) => {
    setInviteForm(prev => ({ ...prev, [key]: value }));
  };

  const handleEditUser = (index: number) => {
    const user = teamMembers[index];
    const [firstName, lastName] = user.name.split(' ');

    setEditingUser({ index, ...user });
    setEditForm({
      firstName: firstName || '',
      lastName: lastName || '',
      email: user.email,
      role: user.role,
      status: user.status
    });
    setShowEditModal(true);
  };

  const handleSaveEditUser = () => {
    if (!editingUser || !editForm.email || !editForm.firstName || !editForm.lastName) return;

    const updatedMembers = [...teamMembers];
    updatedMembers[editingUser.index] = {
      name: `${editForm.firstName} ${editForm.lastName}`,
      email: editForm.email,
      role: editForm.role,
      status: editForm.status
    };

    setTeamMembers(updatedMembers);
    setShowEditModal(false);
    setEditingUser(null);
    setEditForm({
      firstName: '',
      lastName: '',
      email: '',
      role: 'PA Coordinator',
      status: 'Active'
    });

    // Show success message (in real app, this would be a toast notification)
    alert(`User ${editForm.firstName} ${editForm.lastName} updated successfully`);
  };

  const handleEditFormChange = (key: string, value: any) => {
    setEditForm(prev => ({ ...prev, [key]: value }));
  };

  const renderAutomationSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Confidence Thresholds</h3>
        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Auto-Approval Threshold</Label>
            <div className="flex items-center space-x-4">
              <Slider
                value={[automationSettings.autoApprovalThreshold]}
                onValueChange={(value) => handleSettingChange('automation', 'autoApprovalThreshold', value[0])}
                max={100}
                min={80}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12">{automationSettings.autoApprovalThreshold}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              PAs with confidence above this threshold will be automatically approved
            </p>
          </div>

          <div className="space-y-3">
            <Label>Manual Review Threshold</Label>
            <div className="flex items-center space-x-4">
              <Slider
                value={[automationSettings.requireReviewThreshold]}
                onValueChange={(value) => handleSettingChange('automation', 'requireReviewThreshold', value[0])}
                max={90}
                min={60}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12">{automationSettings.requireReviewThreshold}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              PAs with confidence below this threshold require manual review
            </p>
          </div>

          <div className="space-y-3">
            <Label>OCR Accuracy Threshold</Label>
            <div className="flex items-center space-x-4">
              <Slider
                value={[automationSettings.ocrAccuracyThreshold]}
                onValueChange={(value) => handleSettingChange('automation', 'ocrAccuracyThreshold', value[0])}
                max={100}
                min={85}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12">{automationSettings.ocrAccuracyThreshold}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum OCR accuracy required for automatic processing
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Processing Rules</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Enable Bulk Processing</Label>
              <p className="text-sm text-muted-foreground">Process multiple PAs simultaneously</p>
            </div>
            <Switch
              checked={automationSettings.enableBulkProcessing}
              onCheckedChange={(checked) => handleSettingChange('automation', 'enableBulkProcessing', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Confidence Score Display</Label>
              <p className="text-sm text-muted-foreground">Show AI confidence scores in UI</p>
            </div>
            <Switch
              checked={automationSettings.confidenceScoreEnabled}
              onCheckedChange={(checked) => handleSettingChange('automation', 'confidenceScoreEnabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Max Retry Attempts</Label>
            <Select
              value={automationSettings.maxRetryAttempts.toString()}
              onValueChange={(value) => handleSettingChange('automation', 'maxRetryAttempts', Number(value))}
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
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Alert Preferences</h3>
        <div className="space-y-4">
          {[
            { key: 'emailAlerts', label: 'Email Alerts', description: 'Receive notifications via email' },
            { key: 'approvalNotifications', label: 'Approval Notifications', description: 'Get notified when PAs are approved' },
            { key: 'denialNotifications', label: 'Denial Notifications', description: 'Get notified when PAs are denied' },
            { key: 'systemMaintenanceAlerts', label: 'System Maintenance', description: 'Alerts for system updates and maintenance' }
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                onCheckedChange={(checked) => handleSettingChange('notifications', item.key, checked)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Reports & Digests</h3>
        <div className="space-y-4">
          {[
            { key: 'weeklyReports', label: 'Weekly Reports', description: 'Comprehensive weekly performance reports' },
            { key: 'dailyDigest', label: 'Daily Digest', description: 'Daily summary of PA activity' },
            { key: 'slackIntegration', label: 'Slack Integration', description: 'Send notifications to Slack channels' }
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                onCheckedChange={(checked) => handleSettingChange('notifications', item.key, checked)}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderEHRSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">EHR Integration</h3>
          <Button variant="outline" asChild>
            <Link href="/settings/ehr">
              <Globe className="w-4 h-4 mr-2" />
              Manage EHR Connections
            </Link>
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configure your Electronic Health Record system connections to enable data synchronization and automation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Production Environment</h4>
              <Badge variant="outline">0 connections</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No EHR connections configured</p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Development Environment</h4>
              <Badge variant="outline">0 connections</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No EHR connections configured</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Supported EHR Systems</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Epic', 'Cerner', 'athenahealth', 'Allscripts', 'NextGen', 'eClinicalWorks'].map((system) => (
            <div key={system} className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="font-medium text-sm">{system}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">FHIR/REST API</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderWebhookSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Webhook Management</h3>
          <Button variant="outline" asChild>
            <Link href="/settings/webhooks">
              <Webhook className="w-4 h-4 mr-2" />
              Manage Webhooks
            </Link>
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configure webhook endpoints to receive real-time notifications when your team data changes.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Production Webhooks</h4>
              <Badge variant="outline">0 active</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No production webhooks configured</p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Development Webhooks</h4>
              <Badge variant="outline">0 active</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No development webhooks configured</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Available Events</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            'team.created',
            'team.updated',
            'team.deleted',
            'team_member.added',
            'team_member.updated',
            'team_member.removed'
          ].map((event) => (
            <div key={event} className="flex items-center p-2 border border-gray-200 dark:border-gray-700 rounded">
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{event}</code>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">API Connections</h3>
        <div className="space-y-4">
          {Object.entries(integrationStatus).filter(([key]) => key !== 'webhooks').map(([key, integration]) => (
            <div key={key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${integration.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{key === 'cmm' ? 'CMM API' : key}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last sync: {integration.lastSync}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={integration.status === 'healthy' ? "default" : "secondary"} className={
                  integration.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }>
                  {integration.status === 'healthy' ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Error
                    </>
                  )}
                </Badge>
                <Button variant="secondary" size="sm">
                  Configure
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Access Controls</h3>
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
              <p className="text-sm text-muted-foreground">Require multi-factor authentication for all users</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Session Timeout</Label>
              <p className="text-sm text-muted-foreground">Automatically log out inactive users</p>
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Audit & Compliance</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Enable Audit Logging</Label>
              <p className="text-sm text-muted-foreground">Track all user actions and system events</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">HIPAA Compliance Mode</Label>
              <p className="text-sm text-muted-foreground">Enable additional privacy and security controls</p>
            </div>
            <Switch checked disabled />
          </div>
          <div className="space-y-2">
            <Label>Data Retention Period</Label>
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

  const renderUserManagement = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Team Members</h3>
          <Button size="sm" onClick={() => setShowInviteModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>
        <div className="space-y-3">
          {teamMembers.map((user, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline">{user.role}</Badge>
                <Badge variant={user.status === 'Active' ? "default" : "secondary"} className={
                  user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }>
                  {user.status}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => handleEditUser(index)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Role Permissions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-900 dark:text-gray-100">Permission</th>
                <th className="text-center py-2 text-gray-900 dark:text-gray-100">Admin</th>
                <th className="text-center py-2 text-gray-900 dark:text-gray-100">Coordinator</th>
                <th className="text-center py-2 text-gray-900 dark:text-gray-100">Reviewer</th>
                <th className="text-center py-2 text-gray-900 dark:text-gray-100">Read Only</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                'View Dashboard',
                'View ePA Queue',
                'Edit PA Details',
                'Approve PAs',
                'Deny PAs',
                'Bulk Operations',
                'Settings Access',
                'User Management',
                'Analytics'
              ].map((permission, index) => (
                <tr key={index}>
                  <td className="py-2 font-medium text-gray-900 dark:text-gray-100">{permission}</td>
                  <td className="text-center py-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-2">
                    {['View Dashboard', 'View ePA Queue', 'Edit PA Details', 'Analytics'].includes(permission) ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <div className="w-4 h-4 mx-auto"></div>
                    )}
                  </td>
                  <td className="text-center py-2">
                    {['View Dashboard', 'View ePA Queue', 'Analytics'].includes(permission) ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <div className="w-4 h-4 mx-auto"></div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderPayerSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payer Configuration</h3>
          <Button variant="outline" asChild>
            <Link href="/settings/payers">
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Payers
            </Link>
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configure insurance payer settings, portal credentials, and automation rules for your team.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Configured Payers</h4>
              <Badge variant="outline">0 payers</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No payers configured yet</p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Portal Credentials</h4>
              <Badge variant="outline">0 credentials</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No portal credentials stored</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Supported Payers</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Medicare', 'Medicaid', 'Aetna', 'Anthem', 'Cigna', 'UnitedHealthcare', 'Humana', 'BCBS'].map((payer) => (
            <div key={payer} className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="font-medium text-sm">{payer}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Portal Integration</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderFieldMappingSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Field Mappings</h3>
          <Button variant="outline" asChild>
            <Link href="/settings/field-mappings">
              <Settings className="w-4 h-4 mr-2" />
              Manage Field Mappings
            </Link>
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configure custom field mapping rules for data integration between EHR systems and your team&apos;s workflow.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Active Mappings</h4>
              <Badge variant="outline">0 mappings</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No field mappings configured</p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Validation Rules</h4>
              <Badge variant="outline">0 rules</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No validation rules configured</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Entity Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Patient', 'Provider', 'Claim', 'Prior Auth', 'Medication', 'Diagnosis', 'Procedure', 'Insurance'].map((entity) => (
            <div key={entity} className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="font-medium text-sm">{entity}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Field Mapping</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Supported Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Data Transformations</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Text formatting (upper/lower case, trim)</li>
              <li>• Phone number formatting</li>
              <li>• Date/time conversion</li>
              <li>• Name parsing and extraction</li>
              <li>• Custom transformation functions</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Validation Rules</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Required field validation</li>
              <li>• Format validation (email, phone)</li>
              <li>• Length and pattern matching</li>
              <li>• Custom validation rules</li>
              <li>• Blocking vs. warning rules</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'automation':
        return renderAutomationSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'ehr':
        return renderEHRSettings();
      case 'webhooks':
        return renderWebhookSettings();
      case 'payers':
        return renderPayerSettings();
      case 'field-mappings':
        return renderFieldMappingSettings();
      case 'integrations':
        return renderIntegrationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'users':
        return renderUserManagement();
      default:
        return renderAutomationSettings();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your PA automation system configuration</p>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} className="flex items-center">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64">
          <Card className="p-4">
            <nav className="space-y-2">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{section.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{section.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {renderSectionContent()}
        </div>
      </div>

      {/* Invite User Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2 text-primary" />
              Invite New User
            </DialogTitle>
            <DialogDescription>
              Send an invitation to add a new team member to your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="invite-firstName">First Name</Label>
                <Input
                  id="invite-firstName"
                  type="text"
                  value={inviteForm.firstName}
                  onChange={(e) => handleInviteFormChange('firstName', e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-lastName">Last Name</Label>
                <Input
                  id="invite-lastName"
                  type="text"
                  value={inviteForm.lastName}
                  onChange={(e) => handleInviteFormChange('lastName', e.target.value)}
                  placeholder="Smith"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => handleInviteFormChange('email', e.target.value)}
                placeholder="john.smith@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteForm.role} onValueChange={(value) => handleInviteFormChange('role', value)}>
                <SelectTrigger id="invite-role">
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="invite-welcomeEmail"
                checked={inviteForm.sendWelcomeEmail}
                onCheckedChange={(checked) => handleInviteFormChange('sendWelcomeEmail', checked)}
              />
              <Label htmlFor="invite-welcomeEmail" className="text-sm">
                Send welcome email with setup instructions
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInviteModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteUser}
              disabled={!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName}
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="w-5 h-5 mr-2 text-primary" />
              Edit Team Member
            </DialogTitle>
            <DialogDescription>
              Update the team member&apos;s information and permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => handleEditFormChange('firstName', e.target.value)}
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => handleEditFormChange('lastName', e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => handleEditFormChange('email', e.target.value)}
                placeholder="jane.doe@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editForm.role} onValueChange={(value) => handleEditFormChange('role', value)}>
                <SelectTrigger id="edit-role">
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

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editForm.status} onValueChange={(value) => handleEditFormChange('status', value)}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditUser}
              disabled={!editForm.email || !editForm.firstName || !editForm.lastName}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Loading fallback component
function SettingsLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64">
          <Card className="p-4">
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          </Card>
        </div>
        <div className="flex-1">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main exported component with Suspense boundary
export default function SettingsClient({ initialAutomationSettings, initialNotificationSettings }: SettingsProps) {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsPageContent 
        initialAutomationSettings={initialAutomationSettings}
        initialNotificationSettings={initialNotificationSettings}
      />
    </Suspense>
  );
}