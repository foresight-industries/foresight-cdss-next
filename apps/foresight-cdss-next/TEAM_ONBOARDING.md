# Team Onboarding Flow

This document describes the team creation and onboarding flow for new admin users.

## Overview

When a user logs in and doesn't have an active team membership, they'll be automatically redirected to the onboarding flow to create their team.

## Flow Steps

### 1. Authentication Check
- User logs in via Clerk
- Middleware checks if user has active team membership
- If no team → redirect to `/onboard`
- If has team → allow normal app access

### 2. Team Creation (Step 1)
**URL:** `/onboard`

User provides:
- **Team Name** (required) - Display name for the team
- **Team Slug** (required) - URL identifier (auto-generated from name)
- **Team Avatar** (optional) - Logo image upload
- **Description** (optional) - Team description

**Validation:**
- Slug must be unique across all teams
- Slug format: lowercase letters, numbers, hyphens only
- Avatar: Max 5MB, JPEG/PNG/GIF/WebP only

### 3. Team Invitations (Step 2)
**URL:** `/onboard` (step 2)

User can:
- Add team members by email
- Assign roles (Admin/Member)
- Skip and invite later

**Features:**
- Real-time member list
- Remove members before creation
- Email validation
- Role assignment

### 4. Team Creation & Redirect
- Create team in database
- Upload avatar (if provided)
- Send invitations (if any)
- Add creator as super_admin
- Redirect to team subdomain: `{slug}.have-foresight.app`

## API Endpoints

### `POST /api/teams`
Creates a new team and adds creator as super_admin.

**Request:**
```json
{
  "name": "Acme Medical",
  "slug": "acme-medical",
  "description": "Primary care practice",
  "logo_url": "/uploads/team-logo/uuid.png"
}
```

**Response:**
```json
{
  "team": {
    "id": "uuid",
    "name": "Acme Medical",
    "slug": "acme-medical",
    "description": "Primary care practice",
    "logo_url": "/uploads/team-logo/uuid.png",
    "status": "active"
  },
  "message": "Team created successfully"
}
```

### `POST /api/teams/invitations`
Send email invitations to join team.

**Request:**
```json
{
  "team_id": "uuid",
  "invitations": [
    {"email": "doctor@example.com", "role": "admin"},
    {"email": "nurse@example.com", "role": "member"}
  ]
}
```

**Response:**
```json
{
  "success": [
    {"email": "doctor@example.com", "role": "admin", "status": "invited"},
    {"email": "nurse@example.com", "role": "member", "status": "invited"}
  ],
  "errors": [],
  "message": "2 invitation(s) sent successfully"
}
```

### `POST /api/upload`
Upload team logos and other files.

**Request:** FormData with file and type
**Response:**
```json
{
  "url": "/uploads/team-logo/uuid.png",
  "fileName": "uuid.png",
  "size": 12345,
  "type": "image/png"
}
```

## Database Schema

### team table
```sql
- id (uuid, primary key)
- name (text, required)
- slug (text, unique, required)
- description (text, optional)
- logo_url (text, optional)
- status (enum: active/inactive)
- created_at (timestamp)
- updated_at (timestamp)
```

### team_member table
```sql
- id (uuid, primary key)
- team_id (uuid, foreign key)
- user_id (uuid, required for existing users)
- email (text, required for invitations)
- role (enum: super_admin/admin/member)
- status (enum: active/invited/inactive)
- invited_at (timestamp)
- invited_by (uuid, foreign key)
- joined_at (timestamp)
```

## Middleware Logic

The middleware handles automatic redirection:

1. **Check Authentication** - Unauthenticated → `/login`
2. **Check Team Membership** - Authenticated but no team → `/onboard`
3. **Allow Access** - Has team membership → continue to app

**Protected Routes:**
- All app routes require team membership
- Exception: `/onboard`, `/api/teams`, `/api/upload`

## User Experience

### New User Journey
1. User signs up → Clerk authentication
2. First app access → Redirected to `/onboard`
3. Complete team setup → Redirected to `{slug}.have-foresight.app`
4. Future visits → Direct access to team subdomain

### Team URLs
- **Main Site:** `have-foresight.app`
- **Team Dashboard:** `{slug}.have-foresight.app`
- **Team Settings:** `{slug}.have-foresight.app/settings`

### Error Handling
- **Invalid team slug:** Redirect to `/team-not-found`
- **Upload errors:** Display in-form error messages
- **API errors:** User-friendly error alerts

## Security Features

- **Slug validation:** Prevents injection attacks
- **File upload limits:** 5MB max, image types only
- **Team isolation:** Users can only access their team's data
- **Role-based permissions:** Admin actions require proper role

## Development Setup

1. **Database:** Ensure team and team_member tables exist
2. **File uploads:** Create `public/uploads` directory
3. **Environment:** Set domain variables for URL generation
4. **Testing:** Use local domains (see SUBDOMAIN_TESTING.md)

## Future Enhancements

- **Email notifications:** Send actual invitation emails
- **Team branding:** Custom themes per team
- **Bulk invitations:** CSV upload for large teams
- **SSO integration:** Enterprise authentication options
- **Team analytics:** Usage metrics and insights