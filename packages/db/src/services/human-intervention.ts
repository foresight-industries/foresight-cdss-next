import { eq, and, or, desc } from 'drizzle-orm';
import { db } from '../connection';
import { 
  humanInterventions,
  priorAuthWorkflows,
  teamMembers,
  NewHumanIntervention,
  HumanIntervention 
} from '../schema';

export interface NotificationChannel {
  type: 'email' | 'slack' | 'sms' | 'webhook';
  config: {
    email?: string;
    slackWebhook?: string;
    slackChannel?: string;
    phoneNumber?: string;
    webhookUrl?: string;
    headers?: Record<string, string>;
  };
}

export interface InterventionRequest {
  workflowId: string;
  organizationId: string;
  type: 'sms_code_needed' | 'captcha_solve' | 'portal_error' | 'unexpected_ui' | 'manual_review' | 'form_validation_error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  instructions?: string;
  context?: any;
  screenshotUrl?: string;
  browserSessionUrl?: string;
  timeoutMinutes?: number;
}

export interface InterventionAssignment {
  interventionId: string;
  assigneeId: string;
  assignedBy?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
}

export interface InterventionResolution {
  interventionId: string;
  resolution: string;
  resolutionType: 'completed_manually' | 'provided_code' | 'fixed_error' | 'escalated_to_manual' | 'cancelled';
  nextSteps?: string;
  attachments?: string[];
}

export class HumanInterventionService {
  private notificationChannels: Map<string, NotificationChannel[]> = new Map();
  private defaultTimeoutMinutes = 30;

  constructor() {
    this.setupDefaultNotificationChannels();
  }

  async requestIntervention(request: InterventionRequest): Promise<string> {
    try {
      // Calculate timeout
      const timeoutAt = new Date(
        Date.now() + (request.timeoutMinutes || this.defaultTimeoutMinutes) * 60 * 1000
      );

      // Create intervention record
      const newIntervention: NewHumanIntervention = {
        organizationId: request.organizationId,
        workflowId: request.workflowId,
        interventionType: request.type,
        priority: request.priority,
        title: request.title,
        description: request.description,
        instructions: request.instructions,
        context: request.context,
        screenshotUrl: request.screenshotUrl,
        browserSessionUrl: request.browserSessionUrl,
        status: 'pending',
        timeoutAt,
      };

      const [intervention] = await db
        .insert(humanInterventions)
        .values(newIntervention)
        .returning();

      // Send notifications
      await this.sendNotifications(intervention);

      // Auto-assign based on type and availability
      await this.autoAssignIntervention(intervention.id);

      return intervention.id;

    } catch (error) {
      console.error('Error requesting intervention:', error);
      throw new Error(`Failed to request intervention: ${error}`);
    }
  }

  async assignIntervention(assignment: InterventionAssignment): Promise<boolean> {
    try {
      const updateData: Partial<HumanIntervention> = {
        assignedTo: assignment.assigneeId,
        assignedAt: new Date(),
        status: 'assigned',
        updatedAt: new Date(),
      };

      if (assignment.priority) {
        updateData.priority = assignment.priority;
      }

      await db
        .update(humanInterventions)
        .set(updateData)
        .where(eq(humanInterventions.id, assignment.interventionId));

      // Notify assignee
      await this.notifyAssignee(assignment.interventionId, assignment.assigneeId);

      return true;

    } catch (error) {
      console.error('Error assigning intervention:', error);
      return false;
    }
  }

  async resolveIntervention(resolution: InterventionResolution): Promise<boolean> {
    try {
      const responseTime = await this.calculateResponseTime(resolution.interventionId);

      await db
        .update(humanInterventions)
        .set({
          status: 'resolved',
          resolvedAt: new Date(),
          resolution: resolution.resolution,
          resolutionType: resolution.resolutionType,
          responseTime,
          updatedAt: new Date(),
        })
        .where(eq(humanInterventions.id, resolution.interventionId));

      // Update related workflow status
      await this.updateWorkflowAfterResolution(resolution);

      // Send resolution notifications
      await this.sendResolutionNotifications(resolution.interventionId);

      return true;

    } catch (error) {
      console.error('Error resolving intervention:', error);
      return false;
    }
  }

  async escalateIntervention(
    interventionId: string,
    escalationReason: string,
    escalatedBy?: string
  ): Promise<boolean> {
    try {
      await db
        .update(humanInterventions)
        .set({
          status: 'escalated',
          escalatedAt: new Date(),
          escalationReason,
          priority: 'urgent', // Auto-escalate priority
          updatedAt: new Date(),
        })
        .where(eq(humanInterventions.id, interventionId));

      // Notify management/escalation team
      await this.sendEscalationNotifications(interventionId, escalationReason);

      return true;

    } catch (error) {
      console.error('Error escalating intervention:', error);
      return false;
    }
  }

  async getActiveInterventions(
    organizationId?: string,
    assigneeId?: string,
    status?: string
  ): Promise<HumanIntervention[]> {
    const conditions = [];
    
    if (organizationId) {
      conditions.push(eq(humanInterventions.organizationId, organizationId));
    }
    
    if (assigneeId) {
      conditions.push(eq(humanInterventions.assignedTo, assigneeId));
    }
    
    if (status) {
      conditions.push(eq(humanInterventions.status, status));
    } else {
      // Default to active statuses - use or() for multiple status values
      conditions.push(
        or(
          eq(humanInterventions.status, 'pending'),
          eq(humanInterventions.status, 'assigned'),
          eq(humanInterventions.status, 'in_progress')
        )
      );
    }

    // Build the query with all conditions at once
    return await db
      .select()
      .from(humanInterventions)
      .where(and(...conditions))
      .orderBy(desc(humanInterventions.priority), desc(humanInterventions.requestedAt))
      .limit(50);
  }

  async getInterventionDetails(interventionId: string): Promise<HumanIntervention | null> {
    const interventions = await db
      .select()
      .from(humanInterventions)
      .where(eq(humanInterventions.id, interventionId))
      .limit(1);

    return interventions.length > 0 ? interventions[0] : null;
  }

  async checkTimeouts(): Promise<number> {
    try {
      const timedOutInterventions = await db
        .select()
        .from(humanInterventions)
        .where(
          or(
            eq(humanInterventions.status, 'pending'),
            eq(humanInterventions.status, 'assigned'),
            eq(humanInterventions.status, 'in_progress')
          )
        );

      const now = new Date();
      let timeoutCount = 0;

      for (const intervention of timedOutInterventions) {
        if (intervention.timeoutAt && now > intervention.timeoutAt) {
          await this.handleTimeout(intervention.id);
          timeoutCount++;
        }
      }

      return timeoutCount;

    } catch (error) {
      console.error('Error checking timeouts:', error);
      return 0;
    }
  }

  private async sendNotifications(intervention: HumanIntervention): Promise<void> {
    const channels = this.notificationChannels.get(intervention.organizationId) || 
                    this.notificationChannels.get('default') || [];

    const notificationPromises = channels.map(channel => 
      this.sendNotification(channel, intervention)
    );

    try {
      await Promise.allSettled(notificationPromises);
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  private async sendNotification(
    channel: NotificationChannel,
    intervention: HumanIntervention
  ): Promise<void> {
    const message = this.formatNotificationMessage(intervention);

    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(channel.config.email!, message, intervention);
          break;
          
        case 'slack':
          await this.sendSlackNotification(channel.config, message, intervention);
          break;
          
        case 'sms':
          await this.sendSMSNotification(channel.config.phoneNumber!, message);
          break;
          
        case 'webhook':
          await this.sendWebhookNotification(channel.config, intervention);
          break;
      }
    } catch (error) {
      console.error(`Error sending ${channel.type} notification:`, error);
    }
  }

  private async sendEmailNotification(
    email: string,
    message: string,
    intervention: HumanIntervention
  ): Promise<void> {
    // TODO: Integrate with email service (SES, SendGrid, etc.)
    console.log(`[EMAIL] To: ${email}, Subject: ${intervention.title}, Message: ${message}`);
  }

  private async sendSlackNotification(
    config: any,
    message: string,
    intervention: HumanIntervention
  ): Promise<void> {
    if (!config.slackWebhook) return;

    const payload = {
      text: `🚨 Human Intervention Required`,
      attachments: [
        {
          color: this.getPriorityColor(intervention.priority || undefined),
          title: intervention.title,
          text: message,
          fields: [
            {
              title: 'Priority',
              value: intervention.priority?.toUpperCase() || 'MEDIUM',
              short: true,
            },
            {
              title: 'Type',
              value: intervention.interventionType,
              short: true,
            },
            {
              title: 'Workflow ID',
              value: intervention.workflowId,
              short: true,
            },
          ],
          actions: [
            {
              type: 'button',
              text: 'View Details',
              url: `${process.env.APP_URL}/interventions/${intervention.id}`,
            },
            {
              type: 'button',
              text: 'Assign to Me',
              url: `${process.env.APP_URL}/interventions/${intervention.id}/assign`,
            },
          ],
        },
      ],
    };

    const response = await fetch(config.slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
  }

  private async sendSMSNotification(phoneNumber: string, message: string): Promise<void> {
    // TODO: Integrate with SMS service (Twilio, etc.)
    console.log(`[SMS] To: ${phoneNumber}, Message: ${message}`);
  }

  private async sendWebhookNotification(
    config: any,
    intervention: HumanIntervention
  ): Promise<void> {
    if (!config.webhookUrl) return;

    const payload = {
      event: 'human_intervention_requested',
      intervention: {
        id: intervention.id,
        type: intervention.interventionType,
        priority: intervention.priority,
        title: intervention.title,
        description: intervention.description,
        workflowId: intervention.workflowId,
        organizationId: intervention.organizationId,
        requestedAt: intervention.requestedAt,
        timeoutAt: intervention.timeoutAt,
      },
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.statusText}`);
    }
  }

  private async autoAssignIntervention(interventionId: string): Promise<void> {
    try {
      // Get intervention details
      const intervention = await this.getInterventionDetails(interventionId);
      if (!intervention) return;

      // Find available team members for this organization
      const availableMembers = await this.getAvailableTeamMembers(
        intervention.organizationId,
        intervention.interventionType
      );

      if (availableMembers.length === 0) return;

      // Simple round-robin assignment (can be improved with load balancing)
      const assignee = availableMembers[0];

      await this.assignIntervention({
        interventionId,
        assigneeId: assignee.id,
        priority: intervention.priority as 'low' | 'medium' | 'high' | 'urgent' | undefined,
      });

    } catch (error) {
      console.error('Error auto-assigning intervention:', error);
    }
  }

  private async getAvailableTeamMembers(
    organizationId: string,
    interventionType: string
  ): Promise<any[]> {
    // TODO: Implement team member availability logic
    // For now, return all active team members
    const members = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.organizationId, organizationId),
          eq(teamMembers.isActive, true)
        )
      )
      .limit(5);

    return members;
  }

  private async notifyAssignee(interventionId: string, assigneeId: string): Promise<void> {
    // TODO: Send direct notification to assignee
    console.log(`Notifying assignee ${assigneeId} about intervention ${interventionId}`);
  }

  private async updateWorkflowAfterResolution(resolution: InterventionResolution): Promise<void> {
    try {
      const intervention = await this.getInterventionDetails(resolution.interventionId);
      if (!intervention) return;

      // Update workflow based on resolution type
      let workflowStatus = 'in_progress';
      let humanInterventionRequired = false;

      switch (resolution.resolutionType) {
        case 'completed_manually':
          workflowStatus = 'completed';
          break;
        case 'escalated_to_manual':
          workflowStatus = 'failed';
          break;
        case 'cancelled':
          workflowStatus = 'cancelled';
          break;
        case 'provided_code':
        case 'fixed_error':
          workflowStatus = 'in_progress';
          break;
      }

      await db
        .update(priorAuthWorkflows)
        .set({
          status: workflowStatus,
          humanInterventionRequired,
          humanResolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(priorAuthWorkflows.id, intervention.workflowId));

    } catch (error) {
      console.error('Error updating workflow after resolution:', error);
    }
  }

  private async sendResolutionNotifications(interventionId: string): Promise<void> {
    // TODO: Send notifications about intervention resolution
    console.log(`Sending resolution notifications for intervention ${interventionId}`);
  }

  private async sendEscalationNotifications(
    interventionId: string,
    reason: string
  ): Promise<void> {
    // TODO: Send escalation notifications to management
    console.log(`Sending escalation notifications for intervention ${interventionId}: ${reason}`);
  }

  private async handleTimeout(interventionId: string): Promise<void> {
    await db
      .update(humanInterventions)
      .set({
        status: 'escalated',
        escalatedAt: new Date(),
        escalationReason: 'Intervention timeout - no response within allocated time',
        priority: 'urgent',
        updatedAt: new Date(),
      })
      .where(eq(humanInterventions.id, interventionId));

    await this.sendEscalationNotifications(
      interventionId,
      'Automatic escalation due to timeout'
    );
  }

  private async calculateResponseTime(interventionId: string): Promise<number> {
    const intervention = await this.getInterventionDetails(interventionId);
    if (!intervention || !intervention.requestedAt) return 0;

    return Date.now() - intervention.requestedAt.getTime();
  }

  private formatNotificationMessage(intervention: HumanIntervention): string {
    return `
🚨 Human Intervention Required

Title: ${intervention.title}
Priority: ${intervention.priority?.toUpperCase()}
Type: ${intervention.interventionType}

Description: ${intervention.description}

${intervention.instructions ? `Instructions: ${intervention.instructions}` : ''}

Workflow ID: ${intervention.workflowId}
${intervention.screenshotUrl ? `Screenshot: ${intervention.screenshotUrl}` : ''}
${intervention.browserSessionUrl ? `Live Session: ${intervention.browserSessionUrl}` : ''}

Please respond within ${Math.round((intervention.timeoutAt!.getTime() - Date.now()) / (1000 * 60))} minutes.
    `.trim();
  }

  private getPriorityColor(priority?: string): string {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'good';
      case 'low': return '#cccccc';
      default: return 'good';
    }
  }

  private setupDefaultNotificationChannels(): void {
    // Set up default notification channels
    this.notificationChannels.set('default', [
      {
        type: 'slack',
        config: {
          slackWebhook: process.env.SLACK_WEBHOOK_URL,
          slackChannel: '#prior-auth-automation',
        },
      },
      {
        type: 'email',
        config: {
          email: process.env.INTERVENTION_EMAIL || 'interventions@foresight-cdss.com',
        },
      },
    ]);
  }

  configureNotificationChannels(
    organizationId: string,
    channels: NotificationChannel[]
  ): void {
    this.notificationChannels.set(organizationId, channels);
  }

  async getInterventionMetrics(
    organizationId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    totalInterventions: number;
    averageResponseTime: number;
    resolutionRates: Record<string, number>;
    priorityDistribution: Record<string, number>;
  }> {
    // TODO: Implement metrics calculation
    return {
      totalInterventions: 0,
      averageResponseTime: 0,
      resolutionRates: {},
      priorityDistribution: {},
    };
  }
}

export const humanInterventionService = new HumanInterventionService();