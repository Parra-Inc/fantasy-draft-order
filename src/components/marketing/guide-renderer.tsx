import type { GuideSection } from "@/lib/seo/guides";

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function Section({ section }: { section: GuideSection }) {
  switch (section.kind) {
    case "h2":
      return (
        <h2
          id={section.id ?? slugifyHeading(section.text)}
          className="font-display text-chalk mt-12 scroll-mt-20 text-2xl font-bold sm:text-3xl"
        >
          {section.text}
        </h2>
      );
    case "h3":
      return (
        <h3 className="font-display text-chalk mt-8 text-xl font-bold">
          {section.text}
        </h3>
      );
    case "p":
      return (
        <p className="text-chalk/85 mt-5 text-base leading-relaxed sm:text-lg">
          {section.text}
        </p>
      );
    case "ul":
      return (
        <ul className="mt-5 space-y-2 pl-5">
          {section.items.map((item, i) => (
            <li
              key={i}
              className="text-chalk/85 marker:text-signal/60 list-disc text-base leading-relaxed sm:text-lg"
            >
              {item}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="mt-5 space-y-2 pl-5">
          {section.items.map((item, i) => (
            <li
              key={i}
              className="text-chalk/85 marker:text-signal list-decimal text-base leading-relaxed marker:font-mono sm:text-lg"
            >
              {item}
            </li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="border-signal/50 bg-sideline/20 text-chalk/90 mt-6 border-l-2 px-5 py-4 text-base italic sm:text-lg">
          {section.text}
          {section.cite ? (
            <footer className="text-hashmark mt-2 text-xs not-italic">
              — {section.cite}
            </footer>
          ) : null}
        </blockquote>
      );
    case "callout":
      return (
        <div
          className={`mt-6 rounded-2xl border px-5 py-4 text-base sm:text-lg ${
            section.tone === "trust"
              ? "border-signal/40 bg-signal/5 text-chalk/90"
              : "border-sideline/60 bg-sideline/30 text-chalk/85"
          }`}
        >
          {section.text}
        </div>
      );
    case "code":
      return (
        <pre className="border-sideline/50 bg-midnight/80 text-chalk/90 mt-5 overflow-x-auto rounded-xl border p-4 font-mono text-xs sm:text-sm">
          <code>{section.text}</code>
        </pre>
      );
  }
}

export function GuideRenderer({ sections }: { sections: GuideSection[] }) {
  return (
    <div>
      {sections.map((section, i) => (
        <Section key={i} section={section} />
      ))}
    </div>
  );
}
