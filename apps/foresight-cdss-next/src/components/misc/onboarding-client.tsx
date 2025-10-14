'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Users,
  Building2,
  CheckCircle,
  ArrowRight,
  UserPlus,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface TeamMember {
  email: string;
  role: 'admin' | 'member';
}

export default function OnboardingClient() {
  const { user } = useUser();

  // Form state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Team creation form
  const [teamForm, setTeamForm] = useState({
    name: '',
    slug: '',
    description: '',
    logoUrl: ''
  });

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Team invitation state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>('member');

  // Generate slug from team name
  const handleNameChange = (name: string) => {
    setTeamForm(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30)
    }));
  };

  // Handle avatar upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add team member
  const handleAddMember = () => {
    if (newMemberEmail && !teamMembers.find(m => m.email === newMemberEmail)) {
      setTeamMembers(prev => [...prev, { email: newMemberEmail, role: newMemberRole }]);
      setNewMemberEmail('');
    }
  };

  // Remove team member
  const handleRemoveMember = (email: string) => {
    setTeamMembers(prev => prev.filter(m => m.email !== email));
  };

  // Create team
  const handleCreateTeam = async () => {
    setLoading(true);
    setError(null);

    try {
      // Upload avatar if provided
      let logoUrl = '';
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        formData.append('type', 'team-logo');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          logoUrl = uploadData.url;
        }
      }

      // Create team
      const teamResponse = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamForm.name,
          slug: teamForm.slug,
          description: teamForm.description,
          logo_url: logoUrl
        })
      });

      if (!teamResponse.ok) {
        const errorData = await teamResponse.json();
        throw new Error(errorData.error || 'Failed to create team');
      }

      const { team } = await teamResponse.json();

      // Send invitations if any
      if (teamMembers.length > 0) {
        await fetch('/api/teams/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            team_id: team.id,
            invitations: teamMembers
          })
        });
      }

      // Redirect to team dashboard
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const domain = process.env.NODE_ENV === 'production'
        ? 'have-foresight.app'
        : 'foresight.local:3000';

      const teamUrl = `${protocol}://${team.slug}.${domain}`;
      window.location.href = teamUrl;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipInvitations = () => {
    handleCreateTeam();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/android-chrome-192x192.png"
              alt="Foresight Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Foresight RCM
          </h1>
          <p className="text-gray-600">
            Let&apos;s set up your team to get started
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-medium">Team Details</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200"></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="font-medium">Invite Team</span>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <CardDescription className="text-red-800">
              {error}
            </CardDescription>
          </Alert>
        )}

        {/* Step 1: Team Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Create Your Team
              </CardTitle>
              <CardDescription>
                Set up your team with basic information and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Team Avatar */}
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={avatarPreview || undefined} />
                    <AvatarFallback className="text-xl">
                      {teamForm.name.substring(0, 2).toUpperCase() || 'TM'}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition-colors">
                    <Upload className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Team Name */}
              <div>
                <Label htmlFor="team-name">Team Name *</Label>
                <Input
                  id="team-name"
                  value={teamForm.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter your team name"
                  className="mt-1"
                />
              </div>

              {/* Team Slug */}
              <div>
                <Label htmlFor="team-slug">Team URL *</Label>
                <div className="mt-1 flex">
                  <Input
                    id="team-slug"
                    value={teamForm.slug}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="team-slug"
                    className="rounded-r-none"
                  />
                  <div className="bg-gray-50 border border-l-0 rounded-r-md px-3 py-2 text-gray-500 text-sm">
                    .have-foresight.app
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your team will be accessible at {teamForm.slug || 'yourteam'}.have-foresight.app
                </p>
              </div>

              {/* Team Description */}
              <div>
                <Label htmlFor="team-description">Description (Optional)</Label>
                <Textarea
                  id="team-description"
                  value={teamForm.description}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your team or organization"
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Continue Button */}
              <div className="flex justify-between pt-4">
                <div></div>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!teamForm.name || !teamForm.slug}
                  className="flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Invite Team Members */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Invite Your Team
              </CardTitle>
              <CardDescription>
                Add team members now or skip and invite them later
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Member Form */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="member-email">Email Address</Label>
                    <Input
                      id="member-email"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as 'admin' | 'member')}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <Button
                  onClick={handleAddMember}
                  disabled={!newMemberEmail}
                  className="mt-4 w-full md:w-auto flex items-center gap-2"
                  variant="outline"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </Button>
              </div>

              {/* Team Members List */}
              {teamMembers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Team Members ({teamMembers.length})</h4>
                  <div className="space-y-2">
                    {teamMembers.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-sm">
                              {member.email.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.email}</p>
                            <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRemoveMember(member.email)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Back
                </Button>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSkipInvitations}
                    variant="outline"
                    disabled={loading}
                  >
                    Skip for Now
                  </Button>
                  <Button
                    onClick={handleCreateTeam}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create Team
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
