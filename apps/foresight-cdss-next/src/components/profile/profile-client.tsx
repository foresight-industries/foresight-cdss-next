'use client';

import { useState } from 'react';
import { Save, User, Shield, Eye, EyeOff, Camera, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUser } from '@clerk/nextjs';

interface ProfileClientProps {
  initialUserTitle: string;
  teamMembership: any;
  userProfile: any;
  teamMember: any;
  userId: string | null;
}

export default function ProfileClient({
  initialUserTitle,
  teamMembership,
  userProfile,
  teamMember,
  userId,
}: Readonly<ProfileClientProps>) {
  const { user } = useUser();
  // const userEmail = user?.emailAddresses?.[0].emailAddress ?? "";

  const [hasChanges, setHasChanges] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? userProfile?.first_name ?? "",
    lastName: user?.lastName ?? userProfile?.last_name ?? "",
    email: user?.emailAddresses?.[0].emailAddress ?? userProfile?.email ?? "",
    phone: user?.phoneNumbers?.[0]?.phoneNumber ?? userProfile?.phone ?? "",
    title: initialUserTitle,
    department: userProfile?.department ?? "Clinical Operations",
    location: userProfile?.location ?? "New York, NY",
    timezone: userProfile?.timezone ?? "America/New_York",
    bio:
      userProfile?.bio ??
      "Experienced PA Coordinator with healthcare administration expertise.",
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: userProfile?.two_factor_enabled ?? true,
    emailNotifications: userProfile?.email_notifications ?? true,
    smsNotifications: userProfile?.sms_notifications ?? false,
    sessionTimeout: userProfile?.session_timeout ?? "1 hour",
    passwordLastChanged: "30 days ago",
  });

  const handleProfileChange = (key: string, value: string) => {
    setHasChanges(true);
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSecurityChange = (key: string, value: boolean | string) => {
    setHasChanges(true);
    setSecuritySettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      // Save profile data to API
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile: profileForm,
          security: securitySettings,
        }),
      });

      if (response.ok) {
        setHasChanges(false);
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("An error occurred while saving. Please try again.");
    }
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter";
    }
    if (!hasLowerCase) {
      return "Password must contain at least one lowercase letter";
    }
    if (!hasNumbers) {
      return "Password must contain at least one number";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    // Validate inputs
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("All fields are required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    const passwordValidationError = validatePassword(passwordForm.newPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    setPasswordLoading(true);

    try {
      // Call API to change password with Clerk
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        setPasswordSuccess(true);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => {
          setShowPasswordDialog(false);
          setPasswordSuccess(false);
        }, 2000);
      } else {
        const data = await response.json();
        setPasswordError(data.error || 'Failed to update password. Please try again.');
      }
    } catch {
      setPasswordError("An unexpected error occurred");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordFormChange = (key: string, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
    setPasswordError("");
    setPasswordSuccess(false);
  };

  // Generate user initials from name
  const getUserInitials = () => {
    const firstName = profileForm.firstName;
    const lastName = profileForm.lastName;
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your personal information and account preferences
          </p>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} className="flex items-center">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo & Basic Info */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <div className="text-center">
              <div className="relative mx-auto w-24 h-24 mb-4">
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-2xl">
                  {getUserInitials()}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-semibold text-foreground">
                {profileForm.firstName} {profileForm.lastName}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {profileForm.title}
              </p>
              {teamMembership && (
                <p className="text-xs text-muted-foreground mb-2">
                  Team: {teamMembership.team?.name}
                </p>
              )}
              <Badge
                variant="outline"
                className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 border-green-200 dark:border-green-800"
              >
                <Check className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6 mt-6">
            <h4 className="font-semibold text-foreground mb-4">
              Account Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Member since
                </span>
                <span className="text-sm font-medium text-foreground">
                  {teamMember?.created_at
                    ? new Date(teamMember.created_at).toLocaleDateString(
                        "en-US",
                        { month: "short", year: "numeric" }
                      )
                    : "Jan 2023"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Team role</span>
                <span className="text-sm font-medium text-foreground">
                  {teamMember?.role || "PA Coordinator"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium text-foreground capitalize">
                  {teamMember?.status || "Active"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Last login
                </span>
                <span className="text-sm font-medium text-foreground">
                  2 hours ago
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileForm.firstName}
                  onChange={(e) =>
                    handleProfileChange("firstName", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileForm.lastName}
                  onChange={(e) =>
                    handleProfileChange("lastName", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => handleProfileChange("email", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(e) => handleProfileChange("phone", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={profileForm.title}
                  onChange={(e) => handleProfileChange("title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={profileForm.department}
                  onChange={(e) =>
                    handleProfileChange("department", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profileForm.location}
                  onChange={(e) =>
                    handleProfileChange("location", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={profileForm.timezone}
                  onValueChange={(value) =>
                    handleProfileChange("timezone", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">
                      Eastern Time (ET)
                    </SelectItem>
                    <SelectItem value="America/Chicago">
                      Central Time (CT)
                    </SelectItem>
                    <SelectItem value="America/Denver">
                      Mountain Time (MT)
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      Pacific Time (PT)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={profileForm.bio}
                onChange={(e) => handleProfileChange("bio", e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm resize-none focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
                rows={3}
                placeholder="Tell us a bit about yourself..."
              />
            </div>
          </Card>

          {/* Security Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security & Privacy
            </h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">
                    Two-Factor Authentication
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(checked) =>
                    handleSecurityChange("twoFactorEnabled", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive security alerts via email
                  </p>
                </div>
                <Switch
                  checked={securitySettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    handleSecurityChange("emailNotifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive security alerts via SMS
                  </p>
                </div>
                <Switch
                  checked={securitySettings.smsNotifications}
                  onCheckedChange={(checked) =>
                    handleSecurityChange("smsNotifications", checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Session Timeout</Label>
                <Select
                  value={securitySettings.sessionTimeout}
                  onValueChange={(value) =>
                    handleSecurityChange("sessionTimeout", value)
                  }
                >
                  <SelectTrigger className="w-48">
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

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Password</Label>
                    <p className="text-sm text-muted-foreground">
                      Last changed {securitySettings.passwordLastChanged}
                    </p>
                  </div>
                  <Dialog
                    open={showPasswordDialog}
                    onOpenChange={setShowPasswordDialog}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {passwordError && (
                          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                            {passwordError}
                          </div>
                        )}

                        {passwordSuccess && (
                          <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-md">
                            Password updated successfully!
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">
                            Current Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPassword ? "text" : "password"}
                              value={passwordForm.currentPassword}
                              onChange={(e) =>
                                handlePasswordFormChange(
                                  "currentPassword",
                                  e.target.value
                                )
                              }
                              disabled={passwordLoading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={passwordLoading}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              handlePasswordFormChange(
                                "newPassword",
                                e.target.value
                              )
                            }
                            disabled={passwordLoading}
                          />
                          <p className="text-xs text-muted-foreground">
                            Must be at least 8 characters with uppercase,
                            lowercase, number, and special character
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">
                            Confirm New Password
                          </Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              handlePasswordFormChange(
                                "confirmPassword",
                                e.target.value
                              )
                            }
                            disabled={passwordLoading}
                          />
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setShowPasswordDialog(false)}
                            disabled={passwordLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handlePasswordChange}
                            disabled={
                              passwordLoading ||
                              !passwordForm.currentPassword ||
                              !passwordForm.newPassword ||
                              !passwordForm.confirmPassword
                            }
                          >
                            {passwordLoading
                              ? "Updating..."
                              : "Update Password"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
