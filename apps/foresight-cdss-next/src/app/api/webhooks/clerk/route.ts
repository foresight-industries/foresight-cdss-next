import { Webhook } from "svix";
import { headers } from "next/headers";
import { clerkClient, WebhookEvent } from "@clerk/nextjs/server";
import { UserResource } from "@clerk/types";
import { createAuthenticatedDatabaseClient, safeSingle, safeInsert, safeUpdate } from "@/lib/aws/database";
import { eq, and } from "drizzle-orm";
import { teamMembers, organizations } from "@foresight-cdss-next/db";

if (!process.env.CLERK_WEBHOOK_SECRET) {
  throw new Error("Missing CLERK_WEBHOOK_SECRET");
}

export async function POST(req: Request) {
  try {
    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET as string);

    const payload = await req.json();
    const headersList = await headers();

    const clerk = await clerkClient();

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

    // Handle different event types
    let result = { success: true, message: "" };

    switch (evt.type) {
      case "user.created":
        result = await handleUserCreated(
          evt.data as unknown as UserResource,
          clerk
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

      case "organizationMembership.created":
        result = await handleMembershipCreated(evt.data);
        break;

      case "organizationMembership.updated":
        result = await handleMembershipUpdated(evt.data);
        break;

      case "organizationMembership.deleted":
        result = await handleMembershipDeleted(evt.data);
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

// User Management Functions
async function handleUserCreated(data: any, clerk: any) {
  try {
    // Note: Since we don't have a separate user_profile table in AWS schema,
    // user data will be managed through team membership when they join an organization
    console.log(`User created in Clerk: ${data.id}`, {
      email: data.email_addresses?.[0]?.email_address,
      firstName: data.first_name,
      lastName: data.last_name
    });

    return { success: true, message: `User ${data.id} noted for future organization membership` };
  } catch (error) {
    console.error("Error handling user creation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function handleUserUpdated(data: any) {
  try {
    const { db } = await createAuthenticatedDatabaseClient();

    // Update user info in team members table where this user exists
    const { error } = await safeUpdate(async () =>
      db.update(teamMembers)
        .set({
          email: data.email_addresses?.[0]?.email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          updatedAt: new Date()
        })
        .where(eq(teamMembers.clerkUserId, data.id))
    );

    if (error) throw error;

    return { success: true, message: `User ${data.id} updated in team memberships` };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function handleUserDeleted(data: any) {
  try {
    const { db } = await createAuthenticatedDatabaseClient();

    // Soft delete - set status to inactive
    const { error } = await safeUpdate(async () =>
      db.update(teamMembers)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(teamMembers.clerkUserId, data.id))
    );

    if (error) throw error;

    return { success: true, message: `User ${data.id} deactivated` };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Organization Management Functions
async function handleOrganizationCreated(data: any) {
  try {
    const { db } = await createAuthenticatedDatabaseClient();

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

    if (error) throw error;

    return { success: true, message: `Organization ${data.id} created` };
  } catch (error) {
    console.error("Error creating organization:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function handleOrganizationUpdated(data: any) {
  try {
    const { db } = await createAuthenticatedDatabaseClient();

    const { error } = await safeUpdate(async () =>
      db.update(organizations)
        .set({
          name: data.name,
          slug: data.slug,
          updatedAt: new Date()
        })
        .where(eq(organizations.clerkOrgId, data.id))
    );

    if (error) throw error;

    return { success: true, message: `Organization ${data.id} updated` };
  } catch (error) {
    console.error("Error updating organization:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Membership Management Functions
async function handleMembershipCreated(data: any) {
  try {
    const { db } = await createAuthenticatedDatabaseClient();

    // Map Clerk role to AWS access level enum
    const roleMapping = {
      "org:admin": "admin",
      "org:member": "write", 
      "org:viewer": "read",
    };

    const role = roleMapping[data.role as keyof typeof roleMapping] ?? "read";

    // Get organization by Clerk org ID
    const { data: organization } = await safeSingle(async () =>
      db.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.clerkOrgId, data.organization.id))
    );

    if (!organization) {
      // Create organization if it doesn't exist
      const { data: newOrg, error: orgError } = await safeInsert(async () =>
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
            eq(teamMembers.organizationId, (newOrg[0] as any).id)
          ))
      );

      if (!existingMember) {
        // Add user to organization
        const { error: memberError } = await safeInsert(async () =>
          db.insert(teamMembers)
            .values({
              organizationId: (newOrg[0] as any).id,
              clerkUserId: data.public_user_data.user_id,
              email: data.public_user_data.email_address,
              firstName: data.public_user_data.first_name,
              lastName: data.public_user_data.last_name,
              role: role,
              isActive: true
            })
        );

        if (memberError) throw memberError;
      }
    } else {
      // Check if membership already exists
      const { data: existingMember } = await safeSingle(async () =>
        db.select({ id: teamMembers.id })
          .from(teamMembers)
          .where(and(
            eq(teamMembers.clerkUserId, data.public_user_data.user_id),
            eq(teamMembers.organizationId, (organization as any).id)
          ))
      );

      if (!existingMember) {
        // Add user to organization
        const { error: memberError } = await safeInsert(async () =>
          db.insert(teamMembers)
            .values({
              organizationId: (organization as any).id,
              clerkUserId: data.public_user_data.user_id,
              email: data.public_user_data.email_address,
              firstName: data.public_user_data.first_name,
              lastName: data.public_user_data.last_name,
              role: role,
              isActive: true
            })
        );

        if (memberError) throw memberError;
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

async function handleMembershipUpdated(data: any) {
  try {
    const { db } = await createAuthenticatedDatabaseClient();

    // Map Clerk role to AWS access level enum
    const roleMapping = {
      "org:admin": "admin",
      "org:member": "write",
      "org:viewer": "read",
    };

    const role = roleMapping[data.role as keyof typeof roleMapping] ?? "read";

    // Get organization by Clerk org ID
    const { data: organization } = await safeSingle(async () =>
      db.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.clerkOrgId, data.organization.id))
    );

    if (!organization) {
      throw new Error("Organization not found");
    }

    const { error } = await safeUpdate(async () =>
      db.update(teamMembers)
        .set({
          role: role,
          updatedAt: new Date()
        })
        .where(and(
          eq(teamMembers.clerkUserId, data.public_user_data.user_id),
          eq(teamMembers.organizationId, (organization as any).id)
        ))
    );

    if (error) throw error;

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

async function handleMembershipDeleted(data: any) {
  try {
    const { db } = await createAuthenticatedDatabaseClient();

    // Get organization by Clerk org ID
    const { data: organization } = await safeSingle(async () =>
      db.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.clerkOrgId, data.organization.id))
    );

    if (!organization) {
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
          eq(teamMembers.organizationId, (organization as any).id)
        ))
    );

    if (error) throw error;

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