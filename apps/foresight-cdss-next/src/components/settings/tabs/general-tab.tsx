'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface GeneralTabProps {
  organizationId?: string;
}

interface OrganizationSettings {
  name: string;
  taxId: string;
  npiNumber: string;
  billingAddress: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
  };
  primaryContact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export function GeneralTab({ organizationId }: Readonly<GeneralTabProps>) {
  const [settings, setSettings] = useState<OrganizationSettings>({
    name: '',
    taxId: '',
    npiNumber: '',
    billingAddress: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
    },
    primaryContact: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load organization settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/organizations/${organizationId}/settings`);
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setSettings(data.settings);
          }
        } else {
          console.error('Failed to load organization settings');
        }
      } catch (error) {
        console.error('Error loading organization settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [organizationId]);

  const handleInputChange = (field: string, value: string) => {
    setHasChanges(true);
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof OrganizationSettings] as any,
          [child]: value,
        },
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSave = async () => {
    if (!organizationId) {
      toast.error('Organization ID is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setHasChanges(false);
        toast.success('Organization settings saved successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            General Settings
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Basic organization information and administrative settings
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* Organization Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Organization Information
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              type="text"
              value={settings.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter organization name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax-id">Tax ID (EIN)</Label>
              <Input
                id="tax-id"
                type="text"
                value={settings.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                placeholder="XX-XXXXXXX"
                maxLength={10}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Federal Employer Identification Number for billing and tax purposes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="npi-number">Team-wide NPI Number</Label>
              <Input
                id="npi-number"
                type="text"
                value={settings.npiNumber}
                onChange={(e) => handleInputChange('npiNumber', e.target.value)}
                placeholder="1234567890"
                maxLength={10}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                National Provider Identifier for the organization
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Billing Address */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Billing Address
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address-line1">Address Line 1</Label>
            <Input
              id="address-line1"
              type="text"
              value={settings.billingAddress.addressLine1}
              onChange={(e) => handleInputChange('billingAddress.addressLine1', e.target.value)}
              placeholder="Street address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address-line2">Address Line 2 (Optional)</Label>
            <Input
              id="address-line2"
              type="text"
              value={settings.billingAddress.addressLine2}
              onChange={(e) => handleInputChange('billingAddress.addressLine2', e.target.value)}
              placeholder="Apartment, suite, unit, building, floor, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                value={settings.billingAddress.city}
                onChange={(e) => handleInputChange('billingAddress.city', e.target.value)}
                placeholder="City"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                type="text"
                value={settings.billingAddress.state}
                onChange={(e) => handleInputChange('billingAddress.state', e.target.value)}
                placeholder="State"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip-code">ZIP Code</Label>
              <Input
                id="zip-code"
                type="text"
                value={settings.billingAddress.zipCode}
                onChange={(e) => handleInputChange('billingAddress.zipCode', e.target.value)}
                placeholder="ZIP Code"
                maxLength={10}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Primary Contact */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Primary Contact
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-first-name">First Name</Label>
              <Input
                id="contact-first-name"
                type="text"
                value={settings.primaryContact.firstName}
                onChange={(e) => handleInputChange('primaryContact.firstName', e.target.value)}
                placeholder="First name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-last-name">Last Name</Label>
              <Input
                id="contact-last-name"
                type="text"
                value={settings.primaryContact.lastName}
                onChange={(e) => handleInputChange('primaryContact.lastName', e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email Address</Label>
              <Input
                id="contact-email"
                type="email"
                value={settings.primaryContact.email}
                onChange={(e) => handleInputChange('primaryContact.email', e.target.value)}
                placeholder="contact@organization.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone Number</Label>
              <Input
                id="contact-phone"
                type="tel"
                value={settings.primaryContact.phone}
                onChange={(e) => handleInputChange('primaryContact.phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Compliance Notice */}
      <Card className="p-6">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-800 dark:text-green-200">
              HIPAA Compliance
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              All organization data is encrypted at rest and in transit. Access is logged for audit compliance.
              Tax ID and NPI information is stored securely and only accessible to authorized administrators.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}