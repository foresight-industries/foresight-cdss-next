import { Webhook } from "svix";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { WebhookEvent } from "@clerk/nextjs/server";
import { UserResource } from "@clerk/types";

if (!process.env.CLERK_WEBHOOK_SECRET) {
  throw new Error("Missing CLERK_WEBHOOK_SECRET");
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

// Use service role client to bypass RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

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

    // Handle different event types
    let result = { success: true, message: "" };

    switch (evt.type) {
      case "user.created":
        result = await handleUserCreated(evt.data as unknown as UserResource);
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

    // Log webhook event
    const { error: logError } = await supabase
      .from("clerk_webhook_log")
      .insert({
        event_type: `clerk.${evt.type}`,
        clerk_id:
          evt.data.id ?? evt.data.id ?? JSON.parse(evt.data.object)?.user_id,
        payload: evt.data,
        processed_at: new Date().toISOString(),
      });

    if (logError) {
      console.error("Failed to log webhook:", logError);
    }

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
async function handleUserCreated(data: UserResource) {
  try {
    // Create user profile
    const { error } = await supabase
      .from("user_profile")
      .insert({
        id: data.id, // Use Clerk ID as primary key
        email: data.emailAddresses?.[0]?.emailAddress,
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phoneNumbers?.[0]?.phoneNumber,
        clerk_id: data.id,
        created_at: new Date(data.createdAt ?? "").toISOString(),
        updated_at: new Date(data.updatedAt ?? "").toISOString(),
      })
      .select()
      .single();

    if (error && error.code !== "23505") {
      // Ignore duplicate key errors
      throw error;
    }

    return { success: true, message: `User ${data.id} created` };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function handleUserUpdated(data: any) {
  try {
    const { error } = await supabase
      .from("user_profile")
      .update({
        email: data.email_addresses?.[0]?.email_address,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_numbers?.[0]?.phone_number,
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_id", data.id);

    if (error) throw error;

    return { success: true, message: `User ${data.id} updated` };
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
    // Soft delete - set status to inactive
    const { error } = await supabase
      .from("team_member")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", data.id);

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
    // Create team from organization
    const { error } = await supabase
      .from("team")
      .insert({
        id: data.id, // Use Clerk org ID
        name: data.name,
        slug: data.slug,
        clerk_org_id: data.id,
        billing_status: "trialing",
        created_at: new Date(data.created_at).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error?.code !== "23505") {
      throw error;
    }

    return { success: true, message: `Team ${data.id} created` };
  } catch (error) {
    console.error("Error creating team:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function handleOrganizationUpdated(data: any) {
  try {
    const { error } = await supabase
      .from("team")
      .update({
        name: data.name,
        slug: data.slug,
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_org_id", data.id);

    if (error) throw error;

    return { success: true, message: `Team ${data.id} updated` };
  } catch (error) {
    console.error("Error updating team:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Membership Management Functions
async function handleMembershipCreated(data: any) {
  try {
    // Map Clerk role to your role system
    const roleMapping = {
      "org:admin": "org_admin",
      "org:member": "team_user",
      "org:viewer": "read_only",
    };

    const role =
      roleMapping[data.role as keyof typeof roleMapping] ?? "team_user";

    // Add user to team
    const { error } = await supabase.from("team_member").insert({
      id: `${data.organization_id}_${data.public_user_data.user_id}`,
      team_id: data.organization_id,
      user_id: data.public_user_data.user_id,
      role: role,
      permissions: getPermissionsForRole(role),
      status: "active",
      created_at: new Date(data.created_at).toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error && error.code !== "23505") {
      throw error;
    }

    // Update user's current team if this is their first team
    const { data: userProfile } = await supabase
      .from("user_profile")
      .select("current_team_id")
      .eq("id", data.public_user_data.user_id)
      .single();

    if (userProfile && !userProfile.current_team_id) {
      await supabase
        .from("user_profile")
        .update({ current_team_id: data.organization_id })
        .eq("id", data.public_user_data.user_id);
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
    const roleMapping = {
      "org:admin": "org_admin",
      "org:member": "team_user",
      "org:viewer": "read_only",
    };

    const role =
      roleMapping[data.role as keyof typeof roleMapping] ?? "team_user";

    const { error } = await supabase
      .from("team_member")
      .update({
        role: role,
        permissions: getPermissionsForRole(role),
        updated_at: new Date().toISOString(),
      })
      .eq("team_id", data.organization_id)
      .eq("user_id", data.public_user_data.user_id);

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

async function handleMembershipDeleted(data: any) {
  try {
    // Soft delete membership
    const { error } = await supabase
      .from("team_member")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("team_id", data.organization_id)
      .eq("user_id", data.public_user_data.user_id);

    if (error) throw error;

    // If this was user's current team, clear it
    await supabase
      .from("user_profile")
      .update({ current_team_id: null })
      .eq("id", data.public_user_data.user_id)
      .eq("current_team_id", data.organization_id);

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

// Helper function to map role to permissions
function getPermissionsForRole(role: string): string[] {
  const permissionMap = {
    super_admin: ["*"],
    org_admin: [
      "claims.create",
      "claims.read",
      "claims.update",
      "claims.delete",
      "prior_auth.create",
      "prior_auth.read",
      "prior_auth.update",
      "prior_auth.delete",
      "patients.create",
      "patients.read",
      "patients.update",
      "patients.delete",
      "payments.create",
      "payments.read",
      "payments.update",
      "reports.view",
      "reports.export",
      "team.manage",
    ],
    biller: [
      "claims.create",
      "claims.read",
      "claims.update",
      "prior_auth.create",
      "prior_auth.read",
      "prior_auth.update",
      "patients.read",
      "payments.create",
      "payments.read",
      "reports.view",
    ],
    team_user: [
      "claims.create",
      "claims.read",
      "prior_auth.create",
      "prior_auth.read",
      "patients.read",
      "reports.view",
    ],
    read_only: [
      "claims.read",
      "prior_auth.read",
      "patients.read",
      "reports.view",
    ],
  };

  return (
    permissionMap[role as keyof typeof permissionMap] ??
    permissionMap["read_only"]
  );
}
