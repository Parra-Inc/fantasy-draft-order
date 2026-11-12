// Forwards user feedback to RevenueHog's server-to-server feedback API. The
// app's own feedback route keeps its existing storage and notification, then
// calls this as a best-effort second destination. It never throws.
//
// Auth is a per-app server key (rh_live_...) in REVENUE_HOG_API_KEY with the
// feedback:write scope. The key is bound to this app inside RevenueHog, so no
// bundleId is sent: RevenueHog resolves the target app from the key itself.

const REVENUE_HOG_FEEDBACK_URL = "https://app.revenuehog.dev/api/v1/feedback";

// RevenueHog's feedback "kind" enum. The app's own categories are mapped onto
// this; the original category is preserved in metadata so nothing is lost.
export type FeedbackKind = "bug" | "idea" | "question" | "praise";

type ForwardPayload = {
  // The app's own category, kept in metadata.appCategory.
  category: string;
  message: string;
  email?: string | null;
  platform?: string | null;
  appUserId?: string | null;
  // Extra string context (app version, device, locale, ids). Empty values are dropped.
  context?: Record<string, string | null | undefined>;
};

// Fantasy Draft Order types: BUG | FEATURE | PRAISE | OTHER (src/lib/db-enums.ts).
// Unknown values degrade to "question" so a new type never blocks delivery.
const CATEGORY_TO_KIND: Record<string, FeedbackKind> = {
  BUG: "bug",
  FEATURE: "idea",
  PRAISE: "praise",
  OTHER: "question",
};

export async function forwardFeedbackToRevenueHog(
  payload: ForwardPayload,
): Promise<{ success: boolean; status?: number; error?: string }> {
  const key = process.env.REVENUE_HOG_API_KEY;
  if (!key) {
    return { success: false, error: "REVENUE_HOG_API_KEY is not configured" };
  }

  const kind: FeedbackKind = CATEGORY_TO_KIND[payload.category] ?? "question";
  const message = payload.message.trim().slice(0, 5000);
  if (!message) return { success: false, error: "Empty message" };

  const metadata: Record<string, string> = { appCategory: payload.category };
  if (payload.email) metadata.email = payload.email;
  for (const [k, v] of Object.entries(payload.context ?? {})) {
    if (v) metadata[k] = v.slice(0, 500);
  }

  const body: Record<string, unknown> = {
    kind,
    message,
    platform: payload.platform ?? "web",
    metadata,
  };
  if (payload.appUserId) body.appUserId = payload.appUserId;

  try {
    const response = await fetch(REVENUE_HOG_FEEDBACK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    // RevenueHog returns 201 Created on success; accept 200 as well.
    if (response.status === 200 || response.status === 201) {
      return { success: true, status: response.status };
    }

    const errorBody = await response.text().catch(() => "");
    return {
      success: false,
      status: response.status,
      error: `RevenueHog ${response.status}: ${errorBody.slice(0, 300)}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
