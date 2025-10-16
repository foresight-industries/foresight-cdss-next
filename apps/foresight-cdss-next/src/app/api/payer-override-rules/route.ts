import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedDatabaseClient, safeSelect, safeInsert } from "@/lib/aws/database";
import { requireTeamMembership } from "@/lib/team";
import { eq, desc, and } from "drizzle-orm";
import { payerOverrideRules, payers, payerContracts } from "@foresight-cdss-next/db";

export async function GET() {
  try {
    const membership = await requireTeamMembership();
    const { db } = await createAuthenticatedDatabaseClient();

    const { data: rules, error } = await safeSelect(async () =>
      db.select({
        id: payerOverrideRules.id,
        payerId: payerOverrideRules.payerId,
        name: payerOverrideRules.name,
        description: payerOverrideRules.description,
        priority: payerOverrideRules.priority,
        isActive: payerOverrideRules.isActive,
        effectiveFrom: payerOverrideRules.effectiveFrom,
        effectiveTo: payerOverrideRules.effectiveTo,
        createdAt: payerOverrideRules.createdAt,
        updatedAt: payerOverrideRules.updatedAt
      })
        .from(payerOverrideRules)
        .innerJoin(payers, eq(payerOverrideRules.payerId, payers.id))
        .innerJoin(payerContracts, eq(payers.id, payerContracts.payerId))
        .where(eq(payerContracts.organizationId, membership.team_id))
        .orderBy(desc(payerOverrideRules.createdAt))
    );

    if (error) {
      console.error("Error fetching payer override rules:", error);
      return NextResponse.json(
        { error: "Failed to fetch rules" },
        { status: 500 }
      );
    }

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Payer override rules fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const membership = await requireTeamMembership();
    const {
      payerId,
      name,
      description,
      priority,
      isActive,
      effectiveFrom,
      effectiveTo
    } = await req.json();

    if (!payerId || !name || !description) {
      return NextResponse.json(
        { error: "Missing required fields: payerId, name, description" },
        { status: 400 }
      );
    }

    const { db } = await createAuthenticatedDatabaseClient();

    // Verify the payer belongs to the organization
    const { data: payerContract } = await safeSelect(async () =>
      db.select({ id: payerContracts.id })
        .from(payerContracts)
        .where(and(
          eq(payerContracts.organizationId, membership.team_id),
          eq(payerContracts.payerId, payerId)
        ))
        .limit(1)
    );

    if (!payerContract || payerContract.length === 0) {
      return NextResponse.json(
        { error: "Payer not found for this organization" },
        { status: 404 }
      );
    }

    const { data, error } = await safeInsert(async () =>
      db.insert(payerOverrideRules)
        .values({
          payerId,
          name,
          description,
          priority: priority || 0,
          isActive: isActive ?? true,
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
          effectiveTo: effectiveTo ? new Date(effectiveTo) : null
        })
        .returning()
    );

    if (error || !data || data.length === 0) {
      console.error("Error creating payer override rule:", error);
      return NextResponse.json(
        { error: "Failed to create rule" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, rule: data[0] });
  } catch (error) {
    console.error("Payer override rule creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
