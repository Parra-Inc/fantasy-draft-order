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
          className="mt-12 scroll-mt-20 font-display text-2xl font-bold text-chalk sm:text-3xl"
        >
          {section.text}
        </h2>
      );
    case "h3":
      return (
        <h3 className="mt-8 font-display text-xl font-bold text-chalk">
          {section.text}
        </h3>
      );
    case "p":
      return (
        <p className="mt-5 text-base leading-relaxed text-chalk/85 sm:text-lg">
          {section.text}
        </p>
      );
    case "ul":
      return (
        <ul className="mt-5 space-y-2 pl-5">
          {section.items.map((item, i) => (
            <li
              key={i}
              className="list-disc text-base leading-relaxed text-chalk/85 marker:text-signal/60 sm:text-lg"
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
              className="list-decimal text-base leading-relaxed text-chalk/85 marker:font-mono marker:text-signal sm:text-lg"
            >
              {item}
            </li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="mt-6 border-l-2 border-signal/50 bg-sideline/20 px-5 py-4 text-base italic text-chalk/90 sm:text-lg">
          {section.text}
          {section.cite ? (
            <footer className="mt-2 text-xs not-italic text-hashmark">
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
        <pre className="mt-5 overflow-x-auto rounded-xl border border-sideline/50 bg-midnight/80 p-4 font-mono text-xs text-chalk/90 sm:text-sm">
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
