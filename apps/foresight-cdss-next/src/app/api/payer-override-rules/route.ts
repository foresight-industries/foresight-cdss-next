import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireTeamMembership } from "@/lib/team";

export async function GET(req: NextRequest) {
  try {
    const membership = await requireTeamMembership();
    const supabase = await createSupabaseServerClient();

    const { data: rules, error } = await supabase
      .from("payer_override_rule")
      .select("*")
      .eq("team_id", membership.team_id)
      .order("created_at", { ascending: false });

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
      payerName,
      ruleName,
      description,
      ruleType,
      conditions,
      actions,
      enabled,
    } = await req.json();

    if (!payerName || !ruleName || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("payer_override_rule")
      .insert({
        team_id: membership.team_id,
        payer_name: payerName,
        rule_name: ruleName,
        description,
        rule_type: ruleType,
        conditions: conditions || [],
        actions: actions || [],
        enabled: enabled ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating payer override rule:", error);
      return NextResponse.json(
        { error: "Failed to create rule" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, rule: data });
  } catch (error) {
    console.error("Payer override rule creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
