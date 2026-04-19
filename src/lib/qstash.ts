import { Client } from "@upstash/qstash";
import { env, isDev } from "./env";

const client = env.QSTASH_TOKEN ? new Client({ token: env.QSTASH_TOKEN }) : null;

export type ScheduleResult =
  | { scheduled: true; messageId: string }
  | { scheduled: false; reason: string };

export async function scheduleDraft(
  draftId: string,
  fireAt: Date,
): Promise<ScheduleResult> {
  if (!client) {
    if (isDev) {
      console.warn(
        `[qstash] QSTASH_TOKEN missing — draft ${draftId} will not auto-fire. ` +
          `Use POST /api/drafts/[slug]/trigger-dev to run it manually.`,
      );
      return { scheduled: false, reason: "QSTASH_TOKEN not configured" };
    }
    throw new Error("QSTASH_TOKEN is required in production");
  }

  const url = `${env.NEXT_PUBLIC_BASE_URL}/api/jobs/run-draft`;
  const notBefore = Math.floor(fireAt.getTime() / 1000);

  const res = await client.publishJSON({
    url,
    body: { draftId },
    notBefore,
    retries: 3,
  });

  return { scheduled: true, messageId: res.messageId };
}
