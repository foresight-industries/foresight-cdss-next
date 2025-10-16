import { Webhook } from "svix";
import { headers } from "next/headers";
import type {
  WebhookEvent,
  UserWebhookEvent,
  OrganizationWebhookEvent,
  OrganizationMembershipWebhookEvent,
  OrganizationInvitationWebhookEvent,
  UserJSON,
  DeletedObjectJSON,
  OrganizationJSON
} from "@clerk/nextjs/server";
import { safeSingle, safeInsert, safeUpdate, createDatabaseAdminClient } from "@/lib/aws/database";
import { eq, and, sql } from "drizzle-orm";
import { teamMembers, organizations, organizationInvitations, userProfiles, UserProfile, type Organization } from "@foresight-cdss-next/db";
import {
  publishOrganizationCreated,
  // publishOrganizationUpdated,
  // publishOrganizationDeleted,
  // publishUserCreated,
  // publishUserUpdated,
  // publishUserDeleted,
  // publishTeamMemberAdded,
  // publishTeamMemberUpdated,
  // publishTeamMemberRemoved
} from "@/lib/webhooks";

if (!process.env.CLERK_WEBHOOK_SECRET) {
  throw new Error("Missing CLERK_WEBHOOK_SECRET");
}

export async function POST(req: Request) {
  try {
    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET as string);

    const payload = await req.json();
    const headersList = await headers();

    // Get headers for verification
    const svixId = headersList.get("svix-id");
    const svixTimestamp = headersList.get("svix-timestamp");
    const svixSignature = headersList.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    // Verify webhook signature
    let evt: WebhookEvent;
    try {
      evt = webhook.verify(JSON.stringify(payload), {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response("Invalid signature", { status: 401 });
    }

    const userEmail = async () => {
      try {
        // Handle user event types
        if ('email_addresses' in evt.data) {
          return evt.data.email_addresses?.[0]?.email_address ?? null;
        } else if ('deleted' in evt.data) {
          return null;
        } else if ('public_user_data' in evt.data) {
          return evt.data.public_user_data.identifier ?? null;
        }

        // Unhandled event
        return null;
      } catch (error) {
        console.warn("Failed to fetch user email:", error);
        return null;
      }
    };

    // Handle different event types
    let result = { success: true, message: "" };

    switch (evt.type) {
      case "user.created":
        result = await handleUserCreated(
          evt.data
        );
        break;

      case "user.updated":
        result = await handleUserUpdated(evt.data);
        break;

      case "user.deleted":
        result = await handleUserDeleted(evt.data);
        break;

      case "organization.created":
        result = await handleOrganizationCreated(evt.data);
        break;

      case "organization.updated":
        result = await handleOrganizationUpdated(evt.data);
        break;

      case "organization.deleted":
        result = await handleOrganizationDeleted(evt.data);
        break;

      case "organizationMembership.created": {
        const email = await userEmail();
        result = await handleMembershipCreated(evt.data, email);
        break;
      }

      case "organizationMembership.updated":
        result = await handleMembershipUpdated(evt.data);
        break;

      case "organizationMembership.deleted":
        result = await handleMembershipDeleted(evt.data);
        break;

      case "organizationInvitation.created":
        result = await handleInvitationCreated(evt.data);
        break;

      case "organizationInvitation.revoked":
        result = await handleInvitationRevoked(evt.data);
        break;

      default:
        console.log(`Unhandled webhook type: ${evt.type}`);
    }

    // Note: Webhook logging would need to be implemented with AWS schema
    // For now, we'll just log to console
    console.log(`Processed webhook: ${evt.type}`, {
      clerkId: evt.data.id,
      success: result.success,
      message: result.message
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}

const isUserJSON = (data: UserWebhookEvent['data']): data is UserJSON => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    !('deleted' in data) &&
    'email_addresses' in data &&
    typeof data.email_addresses === 'object' &&
    Array.isArray(data.email_addresses)
    // Add other required properties as needed
  );
}

const isDeletedObjectJSON = (data: UserWebhookEvent['data'] | OrganizationWebhookEvent['data']): data is DeletedObjectJSON => {
  return (typeof data === 'object' &&
    data !== null &&
    'deleted' in data &&
    typeof data.deleted === 'boolean' && data.deleted && (data.id === undefined || typeof data.id === 'string') && (data.slug === undefined || typeof data.slug === 'string'));
}

const isOrganizationJSON = (data: OrganizationWebhookEvent['data']): data is OrganizationJSON => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    !('deleted' in data) &&
    typeof data.name === 'string' &&
    (data.slug === undefined || typeof data.slug === 'string')
  );
}

// User Management Functions
async function handleUserCreated(data: UserWebhookEvent['data']) {
  try {
    if (!isUserJSON(data)) {
      throw new TypeError("Invalid user data");
    }

    const { db } = createDatabaseAdminClient();

    // Check if user profile already exists
    const { data: existingUser } = await safeSingle(async () =>
      db.select({ id: userProfiles.id })
        .from(userProfiles)
        .where(eq(userProfiles.clerkUserId, data.id))
    );

    if (existingUser) {
      return { success: true, message: `User ${data.id} already exists` };
    }

    // Create user profile
    const { error } = await safeInsert(async () =>
      db.insert(userProfiles)
        .values({
          clerkUserId: data.id,
          email: data.email_addresses?.[0]?.email_address ?? '',
          firstName: data.first_name,
          lastName: data.last_name,
          role: sql.raw(`'read'::access_level`),
          isActive: true
        })
    );

    if (error) {
      throw error;
    }

    return { success: true, message: `User profile created for ${data.id}` };
  } catch (error) {
    console.error("Error handling user creation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function handleUserUpdated(data: UserWebhookEvent['data']) {
  try {
    if (!isUserJSON(data)) {
      throw new TypeError("Invalid user data");
    }

    const { db } = createDatabaseAdminClient();

    // Update user profile
    const { error } = await safeUpdate(async () =>
      db.update(userProfiles)
        .set({
          email: data.email_addresses?.[0]?.email_address || '',
          firstName: data.first_name,
          lastName: data.last_name,
          updatedAt: new Date()
        })
        .where(eq(userProfiles.clerkUserId, data.id))
    );

    if (error) {
      throw error;
    }

    return { success: true, message: `User profile updated for ${data.id}` };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function handleUserDeleted(data: UserWebhookEvent['data']) {
  try {
    if (!isDeletedObjectJSON(data)) {
      throw new TypeError("Invalid deleted object data");
    }

    if (!data.id) {
      throw new TypeError("Missing user ID in deleted object");
    }

    const { db } = createDatabaseAdminClient();

    // Get user profile to find the internal ID
    const { data: userProfile } : { data: UserProfile | null, error: Error | null } = await safeSingle(async () =>
      db.select({ id: userProfiles.id })
        .from(userProfiles)
        .where(eq(userProfiles.clerkUserId, data.id!))
    );

    // Soft delete user profile
    const { error: profileError } = await safeUpdate(async () =>
      db.update(userProfiles)
        .set({
          isActive: false,
          deletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(userProfiles.clerkUserId, data.id!))
    );

    if (profileError) {
      console.warn("Failed to soft delete user profile:", profileError);
    }

    // Soft delete all team member records for this user
    if (userProfile?.id) {
      const { error: memberError } = await safeUpdate(async () =>
        db.update(teamMembers)
          .set({
            isActive: false,
            deletedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(teamMembers.userProfileId, userProfile.id))
      );

      if (memberError) {
        console.warn("Failed to soft delete team memberships:", memberError);
      }
    }

    return { success: true, message: `User ${data.id} and all memberships deactivated` };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Organization Management Functions
async function handleOrganizationCreated(data: OrganizationWebhookEvent['data']) {
  try {
    const { db } = createDatabaseAdminClient();

    if (!isOrganizationJSON(data)) {
      throw new TypeError("Invalid organization data");
    }

    // Check if organization already exists
    const { data: existingOrg } = await safeSingle(async () =>
      db.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.clerkOrgId, data.id))
    );

    if (existingOrg) {
      return { success: true, message: `Organization ${data.id} already exists` };
    }

    // Create organization from Clerk organization
    const { error } = await safeInsert(async () =>
      db.insert(organizations)
        .values({
          name: data.name,
          slug: data.slug,
          clerkOrgId: data.id
        })
    );

    if (error) {
      throw error;
    }

    // Get the created organization to get internal ID
    const { data: createdOrg } : { data: Organization | null } = await safeSingle(async () =>
      db.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.clerkOrgId, data.id))
    );

    // Publish webhook event
    if (createdOrg?.id) {
      await publishOrganizationCreated(createdOrg.id, {
        clerk_org_id: data.id,
        name: data.name,
        slug: data.slug,
        created_at: new Date().toISOString()
      });
    }

    return { success: true, message: `Organization ${data.id} created` };
  } catch (error) {
    console.error("Error creating organization:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function handleOrganizationUpdated(data: OrganizationWebhookEvent['data']) {
  try {
    if (!isOrganizationJSON(data)) {
      throw new TypeError("Invalid organization data");
    }

    const { db } = createDatabaseAdminClient();

    const { error } = await safeUpdate(async () =>
      db.update(organizations)
        .set({
          name: data.name,
          slug: data.slug,
          updatedAt: new Date()
        })
        .where(eq(organizations.clerkOrgId, data.id))
    );

    if (error) {
      throw error;
    }

    return { success: true, message: `Organization ${data.id} updated` };
  } catch (error) {
    console.error("Error updating organization:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function handleOrganizationDeleted(data: OrganizationWebhookEvent['data']) {
  try {
    if (!isDeletedObjectJSON(data)) {
      throw new TypeError("Invalid deleted object data");
    }

    if (!data.id) {
      throw new TypeError("Missing organization ID in deleted object");
    }

    const { db } = createDatabaseAdminClient();

    // Get organization by Clerk org ID to find the internal ID
    const { data: organization } : { data: Organization | null } = await safeSingle(async () =>
      db.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.clerkOrgId, data.id!))
    );

    if (!organization?.id) {
      console.warn(`Organization ${data.id} not found in database`);
      return { success: true, message: `Organization ${data.id} not found in database` };
    }

    // Update pending organization invitations to 'revoked' status
    const { error: invitationError } = await safeUpdate(async () =>
      db.update(organizationInvitations)
        .set({
          status: "revoked",
          updatedAt: new Date()
        })
        .where(and(
          eq(organizationInvitations.organizationId, organization.id),
          eq(organizationInvitations.status, "pending")
        ))
    );

    if (invitationError) {
      console.warn("Failed to revoke pending invitations:", invitationError);
    }

    // Soft delete the organization - set status and deletedAt
    const { error: orgError } = await safeUpdate(async () =>
      db.update(organizations)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(organizations.id, organization.id))
    );

    if (orgError) {
      throw orgError;
    }

    return { success: true, message: `Organization ${data.id} deleted and invitations revoked` };
  } catch (error) {
    console.error("Error deleting organization:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Membership Management Functions
async function handleMembershipCreated(data: OrganizationMembershipWebhookEvent['data'], email: string | null) {
  try {
    const { db } = createDatabaseAdminClient();

    // Map Clerk role to AWS access level enum
    const roleMapping = {
      "org:admin": "admin",
      "org:member": "write",
      "org:viewer": "read",
    };

    const role = roleMapping[data.role as keyof typeof roleMapping] ?? "read";

    // Get organization by Clerk org ID
    const { data: organization } : { data: Organization | null } = await safeSingle(async () =>
      db.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.clerkOrgId, data.organization.id))
    );

    if (organization) {
      // Check if membership already exists
      const { data: existingMember } = await safeSingle(async () =>
        db.select({ id: teamMembers.id })
          .from(teamMembers)
          .where(and(
            eq(teamMembers.clerkUserId, data.public_user_data.user_id),
            eq(teamMembers.organizationId, organization.id)
          ))
      );

      if (!existingMember) {
        // Add user to organization
        const { error: memberError } = await safeInsert(async () =>
          db.insert(teamMembers)
            .values({
              organizationId: organization.id,
              clerkUserId: data.public_user_data.user_id,
              email,
              firstName: data.public_user_data.first_name,
              lastName: data.public_user_data.last_name,
              role: sql.raw(`'${role}'::access_level`),
              isActive: true
            })
        );

        if (memberError) {
          throw memberError;
        }

        // Check if there's a pending invitation for this user and mark it as accepted
        if (email) {
          const { error: invitationError } = await safeUpdate(async () =>
            db.update(organizationInvitations)
              .set({
                status: "accepted",
                acceptedAt: new Date(),
                updatedAt: new Date()
              })
              .where(and(
                eq(organizationInvitations.organizationId, organization.id),
                eq(organizationInvitations.email, email),
                eq(organizationInvitations.status, "pending")
              ))
          );

          if (invitationError) {
            console.warn("Failed to update invitation status:", invitationError);
          }
        }
      }
    } else {
      // Create organization if it doesn't exist
      const { data: newOrg, error: orgError } : { data: Organization[] | null, error: Error | null } = await safeInsert(async () =>
        db.insert(organizations)
          .values({
            name: data.organization.name,
            slug: data.organization.slug,
            clerkOrgId: data.organization.id
          })
          .returning({ id: organizations.id })
      );

      if (orgError || !newOrg || newOrg.length === 0) {
        throw new Error("Failed to create organization");
      }

      // Check if membership already exists
      const { data: existingMember } = await safeSingle(async () =>
        db.select({ id: teamMembers.id })
          .from(teamMembers)
          .where(and(
            eq(teamMembers.clerkUserId, data.public_user_data.user_id),
            eq(teamMembers.organizationId, newOrg[0].id)
          ))
      );

      if (!existingMember) {
        // Add user to organization
        const { error: memberError } = await safeInsert(async () =>
          db.insert(teamMembers)
            .values({
              organizationId: newOrg[0].id,
              clerkUserId: data.public_user_data.user_id,
              email,
              firstName: data.public_user_data.first_name,
              lastName: data.public_user_data.last_name,
              role: sql.raw(`'${role}'::access_level`),
              isActive: true
            })
        );

        if (memberError) {
          throw memberError;
        }

        // Check if there's a pending invitation for this user and mark it as accepted
        if (email) {
          const { error: invitationError } = await safeUpdate(async () =>
            db.update(organizationInvitations)
              .set({
                status: "accepted",
                acceptedAt: new Date(),
                updatedAt: new Date()
              })
              .where(and(
                eq(organizationInvitations.organizationId, newOrg[0].id),
                eq(organizationInvitations.email, email),
                eq(organizationInvitations.status, "pending")
              ))
          );

          if (invitationError) {
            console.warn("Failed to update invitation status:", invitationError);
          }
        }
      }
    }

    return {
      success: true,
      message: `Membership created for user ${data.public_user_data.user_id}`,
    };
  } catch (error) {
    console.error("Error creating membership:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function handleMembershipUpdated(data: OrganizationMembershipWebhookEvent['data']) {
  try {
    const { db } = createDatabaseAdminClient();

    // Map Clerk role to AWS access level enum
    const roleMapping = {
      "org:admin": "admin",
      "org:member": "write",
      "org:viewer": "read",
    };

    const role = roleMapping[data.role as keyof typeof roleMapping] ?? "read";

    // Get organization by Clerk org ID
    const { data: organization } : { data: Organization | null } = await safeSingle(async () =>
      db.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.clerkOrgId, data.organization.id))
    );

    if (!organization?.id) {
      throw new Error("Organization not found");
    }

    const { error } = await safeUpdate(async () =>
      db.update(teamMembers)
        .set({
          role: sql.raw(`'${role}'::access_level`),
          updatedAt: new Date()
        })
        .where(and(
          eq(teamMembers.clerkUserId, data.public_user_data.user_id),
          eq(teamMembers.organizationId, organization.id)
        ))
    );

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: `Membership updated for user ${data.public_user_data.user_id}`,
    };
  } catch (error) {
    console.error("Error updating membership:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function handleMembershipDeleted(data: OrganizationMembershipWebhookEvent['data']) {
  try {
    const { db } = createDatabaseAdminClient();

    // Get organization by Clerk org ID
    const { data: organization } : { data: Organization | null } = await safeSingle(async () =>
      db.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.clerkOrgId, data.organization.id))
    );

    if (!organization?.id) {
      throw new Error("Organization not found");
    }

    // Soft delete membership
    const { error } = await safeUpdate(async () =>
      db.update(teamMembers)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(teamMembers.clerkUserId, data.public_user_data.user_id),
          eq(teamMembers.organizationId, organization.id)
        ))
    );

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: `Membership deleted for user ${data.public_user_data.user_id}`,
    };
  } catch (error) {
    console.error("Error deleting membership:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Invitation Management Functions
async function handleInvitationCreated(data: OrganizationInvitationWebhookEvent['data']) {
  try {
    const { db } = createDatabaseAdminClient();

    // Get organization by Clerk org ID
    const { data: organization } : { data: Organization | null } = await safeSingle(async () =>
      db.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.clerkOrgId, data.organization_id))
    );

    if (!organization?.id) {
      throw new Error("Organization not found");
    }

    // Map Clerk role to AWS access level enum
    const roleMapping = {
      "org:admin": "admin",
      "org:member": "write",
      "org:viewer": "read",
    };

    const role = roleMapping[data.role as keyof typeof roleMapping] ?? "read";

    // Create invitation record
    const { error } = await safeInsert(async () =>
      db.insert(organizationInvitations)
        .values({
          organizationId: organization.id,
          email: data.email_address,
          role: sql.raw(`'${role}'::access_level`),
          status: "pending",
          clerkInvitationId: data.id,
          expiresAt: data.expires_at ? new Date(data.expires_at) : null,
        })
    );

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: `Invitation created for ${data.email_address}`,
    };
  } catch (error) {
    console.error("Error creating invitation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function handleInvitationRevoked(data: OrganizationInvitationWebhookEvent['data']) {
  try {
    const { db } = createDatabaseAdminClient();

    // Get organization by Clerk org ID
    const { data: organization } : { data: Organization | null } = await safeSingle(async () =>
      db.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.clerkOrgId, data.organization_id))
    );

    if (!organization?.id) {
      throw new Error("Organization not found");
    }

    // Update invitation status to revoked
    const { error } = await safeUpdate(async () =>
      db.update(organizationInvitations)
        .set({
          status: "revoked",
          updatedAt: new Date()
        })
        .where(and(
          eq(organizationInvitations.organizationId, organization.id),
          eq(organizationInvitations.clerkInvitationId, data.id)
        ))
    );

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: `Invitation revoked for ${data.email_address}`,
    };
  } catch (error) {
    console.error("Error revoking invitation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
