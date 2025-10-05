export type UserRole =
  | "super_admin"
  | "org_admin"
  | "biller"
  | "coder"
  | "provider"
  | "nurse"
  | "front_desk"
  | "viewer";

export interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  department: string | null;
  job_title: string | null;
  phone: string | null;
  location: string | null;
  timezone: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  department?: string;
  job_title?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  bio?: string;
  avatar_url?: string;
}
