import { Fragment } from "react";
import Link from "next/link";

/**
 * Minimal inline-link parser for editorial copy that lives in
 * `src/lib/seo/*` as plain strings.
 *
 * Guide bodies were pure text, so the only links out of a guide were the
 * footer, the prev/next pager and the sitemap. That is exactly the shape that
 * gets a live, correctly-defined page crawled but never indexed: nothing on
 * the site points at it from inside the content. Rather than turn the guide
 * data into JSX (which would drag a React import into every metadata module),
 * copy can now write `[label](/path)` and get a real in-body link.
 *
 * Deliberately NOT markdown: only the link form is recognised, only one level
 * deep, and everything else is emitted verbatim. Anything that is not a link
 * renders exactly as typed, so existing copy is untouched.
 */
const LINK_PATTERN = /\[([^\]]+)\]\((\/[^)\s]*|https?:\/\/[^)\s]+)\)/g;

export function renderInline(text: string): React.ReactNode {
  LINK_PATTERN.lastIndex = 0;
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = LINK_PATTERN.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const [, label, href] = match;
    const external = href!.startsWith("http");
    nodes.push(
      external ? (
        <a
          key={`${match.index}-${href}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-signal decoration-signal/40 hover:decoration-signal font-medium underline underline-offset-4"
        >
          {label}
        </a>
      ) : (
        <Link
          key={`${match.index}-${href}`}
          href={href!}
          className="text-signal decoration-signal/40 hover:decoration-signal font-medium underline underline-offset-4"
        >
          {label}
        </Link>
      ),
    );
    cursor = match.index + match[0].length;
  }

  if (cursor === 0) return text;
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return nodes.map((node, i) => <Fragment key={i}>{node}</Fragment>);
}
