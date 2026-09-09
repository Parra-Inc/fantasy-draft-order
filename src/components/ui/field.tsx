import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** The shared field class, `.input` in globals.css: h-11 (44px), the same height as Button md. */
export const fieldClass = "input";

/** Checkboxes and radios share the signal accent so they read as one family with the rest of the UI. */
export const checkClass = "size-4 shrink-0 accent-signal disabled:cursor-not-allowed disabled:opacity-50";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, "min-h-24 resize-y", className)} {...props} />;
}

/**
 * Native select with the browser's own chrome stripped (`appearance-none`
 * plus a hand-drawn chevron) so it reads as the same control as `Input`
 * rather than an OS dropdown. Width classes go on the wrapper `span` so
 * `w-40` / `flex-1` behave exactly as they do on an `Input`; the option list
 * itself stays native, which is the right call on a phone. This replaces the
 * three bare `<select className="input">` elements in the app (new-draft
 * form's platform picker, the feedback modal's type field, and the
 * punishment-suggestion category field), none of which had a chevron before.
 */
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={cn("relative block", className)}>
      <select className={cn(fieldClass, "appearance-none pr-10")} {...props} />
      <ChevronDown
        aria-hidden
        className="text-hashmark pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2"
      />
    </span>
  );
}

export function Checkbox({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return <input type="checkbox" className={cn(checkClass, "rounded", className)} {...props} />;
}

export function Radio({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return <input type="radio" className={cn(checkClass, "mt-0.5", className)} {...props} />;
}

/** Label above a control, matching the uppercase mono label used across every form on the site. */
export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
  ...props
}: {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
} & Omit<LabelHTMLAttributes<HTMLLabelElement>, "className">) {
  return (
    <div className={cn("block", className)}>
      <label
        htmlFor={htmlFor}
        className="text-hashmark mb-1.5 block font-mono text-[11px] font-medium tracking-wider uppercase"
        {...props}
      >
        {label}
      </label>
      {children}
      {hint ? <p className="text-hashmark mt-1.5 text-xs">{hint}</p> : null}
    </div>
  );
}

/** A checkbox or radio with its label, matching the row style used across the site's forms. */
export function CheckRow({
  control,
  label,
  hint,
  className,
}: {
  control: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("text-chalk flex items-start gap-3 text-sm", className)}>
      <span className="flex h-5 items-center">{control}</span>
      <span>
        <span className="block">{label}</span>
        {hint ? <span className="text-hashmark mt-0.5 block text-xs">{hint}</span> : null}
      </span>
    </label>
  );
}
