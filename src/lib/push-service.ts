import webPush from "web-push";
import { env } from "@/lib/env";
import { query, execute } from "@/lib/db";

let isConfigured = false;
if (env.vapidPublicKey && env.vapidPrivateKey) {
  webPush.setVapidDetails(
    env.vapidSubject || "mailto:admin@example.com",
    env.vapidPublicKey,
    env.vapidPrivateKey
  );
  isConfigured = true;
}

interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

export async function sendPushNotification(citizenId: string, payload: {
  title: string;
  body: string;
  url?: string;
  priority?: "normal" | "high" | "critical";
  incidentId?: string;
}): Promise<void> {
  if (!isConfigured) return;
  try {
    const subscriptions = await query<PushSubscriptionRow>(
      'SELECT id, endpoint, p256dh, auth_key FROM push_subscriptions WHERE citizen_id = ?',
      [citizenId]
    );
    if (subscriptions.length === 0) return;
    const stringifiedPayload = JSON.stringify(payload);
    const promises = subscriptions.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth_key,
        },
      };
      try {
        await webPush.sendNotification(pushSub, stringifiedPayload);
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await execute('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]).catch(() => {});
        }
      }
    });
    await Promise.all(promises);
  } catch (err) {}
}

