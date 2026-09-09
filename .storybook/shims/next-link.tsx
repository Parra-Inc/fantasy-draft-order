import type { AnchorHTMLAttributes, ReactNode } from "react";

/** `next/link` outside Next: a plain anchor. There is no router here to intercept the click. */
type NextLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

export default function Link({ href, prefetch, replace, scroll, ...props }: NextLinkProps) {
  void prefetch;
  void replace;
  void scroll;
  return <a href={href} {...props} />;
}
