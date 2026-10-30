import { describe, expect, it } from "vitest";
import { asMarkdown, wantsMarkdown } from "./agent-markdown";

const ai = {
  toMarkdown: async () => [{ data: "# Hi", tokens: 2 }],
};

describe("wantsMarkdown", () => {
  it("matches GET with text/markdown", () => {
    expect(
      wantsMarkdown(new Request("https://x/", { headers: { accept: "text/markdown" } })),
    ).toBe(true);
  });
  it("ignores html and non-GET", () => {
    expect(wantsMarkdown(new Request("https://x/", { headers: { accept: "text/html" } }))).toBe(false);
    expect(
      wantsMarkdown(new Request("https://x/", { method: "POST", headers: { accept: "text/markdown" } })),
    ).toBe(false);
  });
});

describe("asMarkdown", () => {
  it("converts html", async () => {
    const res = await asMarkdown(
      new Response("<h1>Hi</h1>", { headers: { "content-type": "text/html" } }),
      ai,
    );
    expect(res.headers.get("content-type")).toContain("text/markdown");
    expect(res.headers.get("vary")).toBe("Accept");
    expect(res.headers.get("x-markdown-tokens")).toBe("2");
    expect(await res.text()).toBe("# Hi");
  });
  it("passes through non-html and errors", async () => {
    const json = new Response("{}", { headers: { "content-type": "application/json" } });
    expect(await asMarkdown(json, ai)).toBe(json);
    const err = new Response("x", { status: 500, headers: { "content-type": "text/html" } });
    expect(await asMarkdown(err, ai)).toBe(err);
  });
});
