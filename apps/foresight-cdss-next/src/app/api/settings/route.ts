// Updated API route for normalized settings
import { NextRequest, NextResponse } from "next/server";
import { requireTeamMembership } from "@/lib/team";
import { SettingsService } from "@/lib/services/settings.service";

// Initialize the settings service
const settingsService = new SettingsService(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const membership = await requireTeamMembership();

    // Use organization_id from team membership (assuming team = organization)
    const organizationId = membership.team_id;

    // Fetch all settings for the organization using normalized schema
    const settings = await settingsService.getTeamSettings(organizationId);

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const membership = await requireTeamMembership();
    const organizationId = membership.team_id;

    const body = await request.json();
    const { settingType, updates } = body;

    let result;

    switch (settingType) {
      case 'automation':
        result = await settingsService.updateAutomationConfig(organizationId, updates);
        break;

      case 'notifications':
        result = await settingsService.updateNotificationSettings(organizationId, updates);
        break;

      case 'validation':
        result = await settingsService.updateValidationConfig(organizationId, updates);
        break;

      default:
        return NextResponse.json({ error: 'Invalid setting type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// Handle individual rule operations
export async function POST(request: NextRequest) {
  try {
    const membership = await requireTeamMembership();
    const organizationId = membership.team_id;

    const body = await request.json();
    const { ruleType, ruleData } = body;

    let result;

    switch (ruleType) {
      case 'conflict_rule':
        result = await settingsService.createConflictRule(organizationId, ruleData);
        break;

      case 'time_based_rule':
        result = await settingsService.createEmTimeRule(organizationId, ruleData);
        break;

      case 'denial_rule':
        result = await settingsService.createDenialRule(organizationId, ruleData);
        break;

      case 'payer_override_rule':
        result = await settingsService.createPayerOverrideRule(organizationId, ruleData);
        break;

      case 'field_mapping':
        result = await settingsService.createFieldMapping(organizationId, ruleData);
        break;

      default:
        return NextResponse.json({ error: 'Invalid rule type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireTeamMembership(); // Ensure user has access

    const { searchParams } = new URL(request.url);
    const ruleType = searchParams.get('ruleType');
    const ruleId = searchParams.get('ruleId');

    if (!ruleType || !ruleId) {
      return NextResponse.json({ error: 'Missing ruleType or ruleId' }, { status: 400 });
    }

    switch (ruleType) {
      case 'conflict_rule':
        await settingsService.deleteConflictRule(ruleId);
        break;

      case 'time_based_rule':
        await settingsService.deleteTimeBasedRule(ruleId);
        break;

      case 'denial_rule':
        await settingsService.deleteDenialRule(ruleId);
        break;

      case 'payer_override_rule':
        await settingsService.deletePayerOverrideRule(ruleId);
        break;

      case 'field_mapping':
        await settingsService.deleteFieldMapping(ruleId);
        break;

      default:
        return NextResponse.json({ error: 'Invalid rule type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Rule deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete rule' },
      { status: 500 }
    );
  }
}
