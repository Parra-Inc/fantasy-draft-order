import type { ImgHTMLAttributes } from "react";

/**
 * `next/image` outside Next. The app sets `unoptimized: true` in production
 * anyway (see next.config.ts / OpenNext), so Next itself emits a plain
 * `<img>` there too: this shim just does that a build step earlier.
 */
type NextImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number | string;
  unoptimized?: boolean;
};

export default function Image({
  fill,
  priority,
  quality,
  unoptimized,
  style,
  alt = "",
  ...props
}: NextImageProps) {
  void priority;
  void quality;
  void unoptimized;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      {...props}
      style={fill ? { ...style, position: "absolute", inset: 0, width: "100%", height: "100%" } : style}
    />
  );
}
