// Markdown negotiation for AI agents. Cloudflare's "Markdown for Agents" zone
// setting needs a Pro plan, so the Worker entry does it: a GET asking for
// text/markdown gets the rendered HTML converted by Workers AI toMarkdown
// (HTML conversion is free; needs the `AI` binding).

type MarkdownAi = {
  toMarkdown(
    files: { name: string; blob: Blob }[],
  ): Promise<{ data: string; tokens?: number }[]>;
};

export function wantsMarkdown(req: Request): boolean {
  return (
    req.method === "GET" &&
    /\btext\/markdown\b/.test(req.headers.get("accept") ?? "")
  );
}

export async function asMarkdown(
  res: Response,
  ai: MarkdownAi,
): Promise<Response> {
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/html"))
    return res;
  const [doc] = await ai.toMarkdown([
    {
      name: "page.html",
      blob: new Blob([await res.text()], { type: "text/html" }),
    },
  ]);
  const headers = new Headers(res.headers);
  headers.set("content-type", "text/markdown; charset=utf-8");
  // Never cacheable: the cache key ignores Accept, so a cached copy would be served to browsers.
  headers.set("cache-control", "private, no-store");
  headers.set("vary", "Accept");
  headers.set(
    "x-markdown-tokens",
    String(doc.tokens ?? Math.ceil(doc.data.length / 4)),
  );
  headers.delete("content-length");
  return new Response(doc.data, { status: res.status, headers });
}
