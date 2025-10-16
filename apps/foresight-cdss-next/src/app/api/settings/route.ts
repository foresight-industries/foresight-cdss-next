// Updated API route for settings using AWS database
import { NextRequest, NextResponse } from "next/server";
import { requireTeamMembership } from "@/lib/team";
import { createAuthenticatedDatabaseClient, safeSelect, safeSingle, safeInsert, safeUpdate, safeDelete } from "@/lib/aws/database";
import { eq, and } from "drizzle-orm";
import { systemSettings, businessRules, automationRules, notificationTemplates } from "@foresight-cdss-next/db";

export async function GET(_request: NextRequest) {
  try {
    const membership = await requireTeamMembership();
    const { db } = await createAuthenticatedDatabaseClient();
    const organizationId = membership.team_id;

    // Fetch system settings
    const { data: settings } = await safeSelect(async () =>
      db.select()
      .from(systemSettings)
      .where(eq(systemSettings.organizationId, organizationId))
    );

    // Fetch automation rules
    const { data: automationConfig } = await safeSelect(async () =>
      db.select()
      .from(automationRules)
      .where(eq(automationRules.organizationId, organizationId))
    );

    // Fetch business rules
    const { data: businessConfig } = await safeSelect(async () =>
      db.select()
      .from(businessRules)
      .where(eq(businessRules.organizationId, organizationId))
    );

    // Fetch notification templates
    const { data: notificationConfig } = await safeSelect(async () =>
      db.select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.organizationId, organizationId))
    );

    // Organize settings by type
    const organizedSettings = {
      system: settings || [],
      automation: automationConfig || [],
      business_rules: businessConfig || [],
      notifications: notificationConfig || []
    };

    return NextResponse.json({
      success: true,
      data: organizedSettings
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
    const { db } = await createAuthenticatedDatabaseClient();
    const organizationId = membership.team_id;

    const body = await request.json();
    const { settingType, settingKey, settingValue, ruleId, updates } = body;

    let result;

    switch (settingType) {
      case 'system': {
        // Update or create system setting
        if (!settingKey) {
          return NextResponse.json({ error: 'settingKey is required for system settings' }, { status: 400 });
        }
        
        const { data: existingSetting } = await safeSingle(async () =>
          db.select({ id: systemSettings.id })
          .from(systemSettings)
          .where(and(
            eq(systemSettings.organizationId, organizationId),
            eq(systemSettings.settingKey, settingKey)
          ))
        );

        if (existingSetting) {
          // Update existing setting
          const { data: updated } = await safeUpdate(async () =>
            db.update(systemSettings)
              .set({ 
                settingValue: JSON.stringify(settingValue),
                updatedAt: new Date()
              })
              .where(eq(systemSettings.id, (existingSetting as { id: string }).id))
              .returning()
          );
          result = updated?.[0];
        } else {
          // Create new setting
          const { data: created } = await safeInsert(async () =>
            db.insert(systemSettings)
              .values({
                organizationId,
                settingKey,
                settingValue: JSON.stringify(settingValue),
                scope: 'organization'
              })
              .returning()
          );
          result = created?.[0];
        }
        break;
      }

      case 'automation': {
        if (!ruleId) {
          return NextResponse.json({ error: 'ruleId is required for automation updates' }, { status: 400 });
        }
        
        const { data: automationResult } = await safeUpdate(async () =>
          db.update(automationRules)
            .set({ 
              ...updates,
              updatedAt: new Date()
            })
            .where(and(
              eq(automationRules.id, ruleId),
              eq(automationRules.organizationId, organizationId)
            ))
            .returning()
        );
        result = automationResult?.[0];
        break;
      }

      case 'notifications': {
        if (!ruleId) {
          return NextResponse.json({ error: 'ruleId is required for notification updates' }, { status: 400 });
        }
        
        const { data: notificationResult } = await safeUpdate(async () =>
          db.update(notificationTemplates)
            .set({ 
              ...updates,
              updatedAt: new Date()
            })
            .where(and(
              eq(notificationTemplates.id, ruleId),
              eq(notificationTemplates.organizationId, organizationId)
            ))
            .returning()
        );
        result = notificationResult?.[0];
        break;
      }

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
    const { db } = await createAuthenticatedDatabaseClient();
    const organizationId = membership.team_id;

    const body = await request.json();
    const { ruleType, ruleData } = body;

    let result;

    switch (ruleType) {
      case 'automation_rule': {
        const { data: automationRule } = await safeInsert(async () =>
          db.insert(automationRules)
            .values({
              organizationId,
              name: ruleData.name,
              description: ruleData.description,
              category: ruleData.category,
              ruleType: ruleData.ruleType || 'trigger',
              triggerConditions: ruleData.triggerConditions,
              actions: ruleData.actions,
              priority: ruleData.priority || 50,
              isActive: ruleData.isActive ?? true
            })
            .returning()
        );
        result = automationRule?.[0];
        break;
      }

      case 'business_rule': {
        const { data: businessRule } = await safeInsert(async () =>
          db.insert(businessRules)
            .values({
              organizationId,
              name: ruleData.name,
              description: ruleData.description,
              category: ruleData.category,
              triggerEvent: ruleData.triggerEvent,
              conditions: ruleData.conditions,
              actions: ruleData.actions,
              priority: ruleData.priority || 50,
              isActive: ruleData.isActive ?? true
            })
            .returning()
        );
        result = businessRule?.[0];
        break;
      }

      case 'notification_template': {
        const { data: notificationTemplate } = await safeInsert(async () =>
          db.insert(notificationTemplates)
            .values({
              organizationId,
              name: ruleData.name,
              description: ruleData.description,
              type: ruleData.type,
              subject: ruleData.subject,
              body: ruleData.body,
              htmlBody: ruleData.htmlBody,
              isActive: ruleData.isActive ?? true
            })
            .returning()
        );
        result = notificationTemplate?.[0];
        break;
      }

      case 'system_setting': {
        const { data: systemSetting } = await safeInsert(async () =>
          db.insert(systemSettings)
            .values({
              organizationId,
              settingKey: ruleData.settingKey,
              settingValue: JSON.stringify(ruleData.settingValue),
              scope: ruleData.scope || 'organization',
              category: ruleData.category,
              description: ruleData.description
            })
            .returning()
        );
        result = systemSetting?.[0];
        break;
      }

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
    const membership = await requireTeamMembership();
    const { db } = await createAuthenticatedDatabaseClient();
    const organizationId = membership.team_id;

    const { searchParams } = new URL(request.url);
    const ruleType = searchParams.get('ruleType');
    const ruleId = searchParams.get('ruleId');

    if (!ruleType || !ruleId) {
      return NextResponse.json({ error: 'Missing ruleType or ruleId' }, { status: 400 });
    }

    switch (ruleType) {
      case 'automation_rule':
        await safeDelete(async () =>
          db.delete(automationRules)
            .where(and(
              eq(automationRules.id, ruleId),
              eq(automationRules.organizationId, organizationId)
            ))
        );
        break;

      case 'business_rule':
        await safeDelete(async () =>
          db.delete(businessRules)
            .where(and(
              eq(businessRules.id, ruleId),
              eq(businessRules.organizationId, organizationId)
            ))
        );
        break;

      case 'notification_template':
        await safeDelete(async () =>
          db.delete(notificationTemplates)
            .where(and(
              eq(notificationTemplates.id, ruleId),
              eq(notificationTemplates.organizationId, organizationId)
            ))
        );
        break;

      case 'system_setting':
        await safeDelete(async () =>
          db.delete(systemSettings)
            .where(and(
              eq(systemSettings.id, ruleId),
              eq(systemSettings.organizationId, organizationId)
            ))
        );
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
