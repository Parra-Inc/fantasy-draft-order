import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

/*
 * The canonical CTA classes, lifted from the repeated `bg-signal text-midnight
 * hover:bg-signal-dark ... rounded-xl` string on the marketing pages and the
 * share panel: every primary call to action on the site already looked like
 * this, it was just retyped in a dozen files instead of shared. `md` (h-11,
 * 44px) is the height most of those buttons already use, so it is also the
 * height `.input` is matched to (see form-controls.stories.tsx).
 */
const variants: Record<ButtonVariant, string> = {
  primary: "bg-signal text-midnight hover:bg-signal-dark",
  outline: "border border-sideline text-chalk hover:border-signal/50",
  ghost: "text-chalk hover:bg-sideline/40",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

export type ButtonProps = Common &
  (
    | ({ href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">)
    | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href">)
  );

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: Pick<Common, "variant" | "size" | "className"> = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    sizes[size],
    variants[variant],
    className,
  );
}

export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { href, variant, size, className, children, ...rest } = props;
    return (
      <a href={href} className={buttonClass({ variant, size, className })} {...rest}>
        {children}
      </a>
    );
  }
  const { variant, size, className, children, ...rest } = props;
  return (
    <button type="button" className={buttonClass({ variant, size, className })} {...rest}>
      {children}
    </button>
  );
}
