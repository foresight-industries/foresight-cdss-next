'use client';

import { useState } from 'react';
import { Save, Bell, Shield, Database, Zap, Users, AlertTriangle, CheckCircle, X, Mail, UserPlus, Edit } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SettingsSection {
  id: string;
  title: string;
  icon: any;
  description: string;
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
    id: 'integrations',
    title: 'Integrations',
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

export default function SettingsPage() {
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

  const [automationSettings, setAutomationSettings] = useState({
    autoApprovalThreshold: 90,
    requireReviewThreshold: 70,
    maxRetryAttempts: 3,
    enableBulkProcessing: true,
    confidenceScoreEnabled: true,
    ocrAccuracyThreshold: 95
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    slackIntegration: false,
    approvalNotifications: true,
    denialNotifications: true,
    systemMaintenanceAlerts: true,
    weeklyReports: true,
    dailyDigest: false
  });

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

  const handleSave = () => {
    // In real implementation, this would save to backend
    setHasChanges(false);
    // Show success message
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Thresholds</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto-Approval Threshold
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="80"
                max="100"
                value={automationSettings.autoApprovalThreshold}
                onChange={(e) => handleSettingChange('automation', 'autoApprovalThreshold', Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12">{automationSettings.autoApprovalThreshold}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PAs with confidence above this threshold will be automatically approved
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manual Review Threshold
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="60"
                max="90"
                value={automationSettings.requireReviewThreshold}
                onChange={(e) => handleSettingChange('automation', 'requireReviewThreshold', Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12">{automationSettings.requireReviewThreshold}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PAs with confidence below this threshold require manual review
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OCR Accuracy Threshold
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="85"
                max="100"
                value={automationSettings.ocrAccuracyThreshold}
                onChange={(e) => handleSettingChange('automation', 'ocrAccuracyThreshold', Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12">{automationSettings.ocrAccuracyThreshold}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum OCR accuracy required for automatic processing
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Rules</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Enable Bulk Processing</p>
              <p className="text-sm text-gray-500">Process multiple PAs simultaneously</p>
            </div>
            <input
              type="checkbox"
              checked={automationSettings.enableBulkProcessing}
              onChange={(e) => handleSettingChange('automation', 'enableBulkProcessing', e.target.checked)}
              className="h-4 w-4 text-blue-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Confidence Score Display</p>
              <p className="text-sm text-gray-500">Show AI confidence scores in UI</p>
            </div>
            <input
              type="checkbox"
              checked={automationSettings.confidenceScoreEnabled}
              onChange={(e) => handleSettingChange('automation', 'confidenceScoreEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Retry Attempts
            </label>
            <select
              value={automationSettings.maxRetryAttempts}
              onChange={(e) => handleSettingChange('automation', 'maxRetryAttempts', Number(e.target.value))}
              className="block w-full border border-gray-300 rounded-md py-2 px-3"
            >
              <option value={1}>1 attempt</option>
              <option value={2}>2 attempts</option>
              <option value={3}>3 attempts</option>
              <option value={5}>5 attempts</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Preferences</h3>
        <div className="space-y-4">
          {[
            { key: 'emailAlerts', label: 'Email Alerts', description: 'Receive notifications via email' },
            { key: 'approvalNotifications', label: 'Approval Notifications', description: 'Get notified when PAs are approved' },
            { key: 'denialNotifications', label: 'Denial Notifications', description: 'Get notified when PAs are denied' },
            { key: 'systemMaintenanceAlerts', label: 'System Maintenance', description: 'Alerts for system updates and maintenance' }
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                onChange={(e) => handleSettingChange('notifications', item.key, e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports & Digests</h3>
        <div className="space-y-4">
          {[
            { key: 'weeklyReports', label: 'Weekly Reports', description: 'Comprehensive weekly performance reports' },
            { key: 'dailyDigest', label: 'Daily Digest', description: 'Daily summary of PA activity' },
            { key: 'slackIntegration', label: 'Slack Integration', description: 'Send notifications to Slack channels' }
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                onChange={(e) => handleSettingChange('notifications', item.key, e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Connections</h3>
        <div className="space-y-4">
          {Object.entries(integrationStatus).map(([key, integration]) => (
            <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${integration.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="font-medium text-gray-900 capitalize">{key === 'cmm' ? 'CMM API' : key}</p>
                  <p className="text-sm text-gray-500">Last sync: {integration.lastSync}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={integration.status === 'healthy' ? "auto-approved" : "denied"} className={
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

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhook Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
            <input
              type="url"
              placeholder="https://your-domain.com/webhooks/pa-status"
              className="w-full border border-gray-300 rounded-md py-2 px-3"
              readOnly
              value="https://api.foresight.health/webhooks/pa-status"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
            <div className="flex space-x-2">
              <input
                type="password"
                value="••••••••••••••••"
                className="flex-1 border border-gray-300 rounded-md py-2 px-3"
                readOnly
              />
              <Button variant="secondary" size="sm">Regenerate</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Controls</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default User Role</label>
            <select className="block w-full border border-gray-300 rounded-md py-2 px-3">
              <option>PA Coordinator</option>
              <option>PA Reviewer</option>
              <option>Administrator</option>
              <option>Read Only</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Require MFA</p>
              <p className="text-sm text-gray-500">Require multi-factor authentication for all users</p>
            </div>
            <input type="checkbox" className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Session Timeout</p>
              <p className="text-sm text-gray-500">Automatically log out inactive users</p>
            </div>
            <select className="border border-gray-300 rounded-md py-1 px-2 text-sm">
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>4 hours</option>
              <option>8 hours</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit & Compliance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Enable Audit Logging</p>
              <p className="text-sm text-gray-500">Track all user actions and system events</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">HIPAA Compliance Mode</p>
              <p className="text-sm text-gray-500">Enable additional privacy and security controls</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention Period</label>
            <select className="block w-full border border-gray-300 rounded-md py-2 px-3">
              <option>1 year</option>
              <option>2 years</option>
              <option>5 years</option>
              <option>7 years</option>
              <option>Indefinite</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
          <Button size="sm" onClick={() => setShowInviteModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>
        <div className="space-y-3">
          {teamMembers.map((user, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="needs-review">{user.role}</Badge>
                <Badge variant={user.status === 'Active' ? "auto-approved" : "default"} className={
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Permission</th>
                <th className="text-center py-2">Admin</th>
                <th className="text-center py-2">Coordinator</th>
                <th className="text-center py-2">Reviewer</th>
                <th className="text-center py-2">Read Only</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                'View Dashboard',
                'View PA Queue',
                'Edit PA Details',
                'Approve PAs',
                'Deny PAs',
                'Bulk Operations',
                'Settings Access',
                'User Management',
                'Analytics'
              ].map((permission, index) => (
                <tr key={index}>
                  <td className="py-2 font-medium">{permission}</td>
                  <td className="text-center py-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-2">
                    {['View Dashboard', 'View PA Queue', 'Edit PA Details', 'Analytics'].includes(permission) ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <div className="w-4 h-4 mx-auto"></div>
                    )}
                  </td>
                  <td className="text-center py-2">
                    {['View Dashboard', 'View PA Queue', 'Analytics'].includes(permission) ? (
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

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'automation':
        return renderAutomationSettings();
      case 'notifications':
        return renderNotificationSettings();
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
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your PA automation system configuration</p>
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
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{section.title}</div>
                      <div className="text-xs text-gray-500">{section.description}</div>
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
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-600" />
                Invite New User
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={inviteForm.firstName}
                      onChange={(e) => handleInviteFormChange('firstName', e.target.value)}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={inviteForm.lastName}
                      onChange={(e) => handleInviteFormChange('lastName', e.target.value)}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => handleInviteFormChange('email', e.target.value)}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john.smith@company.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => handleInviteFormChange('role', e.target.value)}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="PA Coordinator">PA Coordinator</option>
                    <option value="PA Reviewer">PA Reviewer</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Read Only">Read Only</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendWelcomeEmail"
                    checked={inviteForm.sendWelcomeEmail}
                    onChange={(e) => handleInviteFormChange('sendWelcomeEmail', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="sendWelcomeEmail" className="text-sm text-gray-700">
                    Send welcome email with setup instructions
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="primary"
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Edit className="w-5 h-5 mr-2 text-blue-600" />
                Edit Team Member
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => handleEditFormChange('firstName', e.target.value)}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => handleEditFormChange('lastName', e.target.value)}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleEditFormChange('email', e.target.value)}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="jane.doe@company.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => handleEditFormChange('role', e.target.value)}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="PA Coordinator">PA Coordinator</option>
                    <option value="PA Reviewer">PA Reviewer</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Read Only">Read Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => handleEditFormChange('status', e.target.value)}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="primary"
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
