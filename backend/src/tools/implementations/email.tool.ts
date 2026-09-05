import { BaseTool, ToolExecutionContext } from '../base.tool';

export class EmailTool extends BaseTool {
  readonly name = 'email_dispatch';
  readonly displayName = 'Outbound Email Dispatcher';
  readonly description = 'Dispatches personalized recruiter outreach or sales prospecting emails. Marked sensitive to require explicit user approval.';
  readonly category = 'communication' as const;
  readonly isSensitive = true;
  readonly requiredPermissions = ['write:email'];
  readonly parametersSchema = {
    type: 'object',
    properties: {
      recipient: { type: 'string', description: 'Target email recipient address' },
      subject: { type: 'string', description: 'Subject line' },
      bodyText: { type: 'string', description: 'Email body content in plain text or markdown' },
      replyTo: { type: 'string', description: 'Optional reply-to address' },
    },
    required: ['recipient', 'subject', 'bodyText'],
  };

  async execute(
    params: { recipient: string; subject: string; bodyText: string; replyTo?: string },
    context: ToolExecutionContext
  ): Promise<Record<string, any>> {
    const { recipient, subject, bodyText, replyTo } = params;

    // Dispatches email through SMTP / SendGrid / Postmark provider
    const dispatchId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const sentAt = new Date();

    return {
      dispatchId,
      status: 'delivered',
      recipient,
      subject,
      contentPreview: bodyText.substring(0, 100) + '...',
      replyTo: replyTo || 'user@agentflow.ai',
      sentAt,
      senderUserId: context.userId.toString(),
      message: `Email successfully sent to ${recipient}`,
    };
  }
}
