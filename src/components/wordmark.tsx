/**
 * The product name lockup. Stacks onto two lines below `lg` so the header
 * still fits next to the nav and the CTA on phones and tablets.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-chalk text-sm leading-[1.15] font-bold tracking-tight lg:text-lg lg:leading-none ${className}`}
    >
      <span className="block lg:inline">Fantasy Football</span>{" "}
      <span className="block lg:inline">Draft Order</span>
    </span>
  );
}
