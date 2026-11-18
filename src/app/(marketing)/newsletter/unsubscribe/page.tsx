import { buildMetadata } from "@/lib/seo/metadata";
import { UnsubscribeConfirm } from "./unsubscribe-confirm";

export const metadata = buildMetadata({
  title: "Unsubscribe from the newsletter",
  description: "Stop getting the Fantasy Football Draft Order newsletter.",
  path: "/newsletter/unsubscribe",
  noindex: true,
});

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <section className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-chalk text-3xl font-bold tracking-tight">Unsubscribe</h1>
      <UnsubscribeConfirm token={typeof token === "string" ? token : ""} />
    </section>
  );
}
