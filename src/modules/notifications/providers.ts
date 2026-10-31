/* ════════════════════════════════════════════════════════
   Notification Provider Interface
   ════════════════════════════════════════════════════════ */

export interface NotificationProvider {
  readonly providerName: string;
  readonly channel: NotificationChannel;

  send(notification: NotificationPayload): Promise<DeliveryResult>;
}

export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS" | "PUSH" | "CONSOLE";

export interface NotificationPayload {
  recipientId: string;
  templateKey: string;
  channel: NotificationChannel;
  data: Record<string, string>;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}

export interface DeliveryResult {
  success: boolean;
  provider: string;
  externalId?: string;
  error?: string;
  retryable: boolean;
}

/** Console provider for development — logs to stdout */
export class ConsoleNotificationProvider implements NotificationProvider {
  readonly providerName = "console";
  readonly channel: NotificationChannel = "CONSOLE";

  async send(notification: NotificationPayload): Promise<DeliveryResult> {
    console.log(`[NOTIFICATION] ${notification.channel} → ${notification.recipientId}`, {
      template: notification.templateKey,
      data: notification.data,
      priority: notification.priority,
    });

    return {
      success: true,
      provider: "console",
      retryable: false,
    };
  }
}
