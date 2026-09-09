import type { Meta, StoryObj } from "@storybook/react-vite";
import { Container, Eyebrow } from "@/components/ui/layout";

/** One gutter (`Container`), a small set of content widths, and the eyebrow-plus-heading pair that opens every section. */
const meta = {
  title: "Components/Layout",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Block({ label }: { label: string }) {
  return (
    <div className="border-signal/40 bg-signal/5 text-hashmark rounded-lg border border-dashed px-4 py-8 text-center text-sm">
      {label}
    </div>
  );
}

const widths = [
  ["max-w-md", "Forms: new draft, feedback, the punishment picker"],
  ["max-w-3xl", "Guide articles and long-form editorial"],
  ["max-w-6xl", "The header, footer, and every marketing section"],
] as const;

export const ContainerWidths: Story = {
  render: () => (
    <div className="grid gap-6 py-8">
      {widths.map(([cls, use]) => (
        <div key={cls} className={`mx-auto w-full ${cls} px-4 sm:px-6`}>
          <div className="border-sideline/50 bg-sideline/10 text-hashmark rounded-lg border px-3 py-2 text-xs">
            <span className="text-chalk font-mono">{cls}</span> · {use}
          </div>
        </div>
      ))}
      <Container>
        <Block label="Container: mx-auto max-w-6xl px-4 sm:px-6, the header/footer gutter" />
      </Container>
    </div>
  ),
};

export const SectionRhythm: Story = {
  render: () => (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Eyebrow>Trust</Eyebrow>
      <h1 className="font-display text-chalk mt-3 text-3xl font-bold sm:text-4xl">
        Is your fantasy draft order actually random?
      </h1>
      <p className="text-hashmark mt-3 text-base leading-relaxed">
        6 min read · Updated April 2026
      </p>
      {["Test 1: Is the algorithm public?", "Test 2: Is the seed independent of the result?"].map((heading) => (
        <section key={heading} className="border-sideline/40 mt-10 border-t pt-8">
          <h2 className="font-display text-chalk text-2xl font-bold">{heading}</h2>
          <p className="text-chalk/85 mt-4 text-base leading-relaxed">
            Section bodies sit mt-4 under an h2, and sections are separated by
            a border-t with mt-10 pt-8 between them.
          </p>
        </section>
      ))}
    </div>
  ),
};

/** The signal-green eyebrow above nearly every heading on the site, in both its tones. */
export const EyebrowHeading: Story = {
  render: () => (
    <div className="mx-auto grid max-w-3xl gap-10 px-4 py-10 sm:px-6">
      <div>
        <Eyebrow>Trust</Eyebrow>
        <h2 className="font-display text-chalk mt-3 text-3xl font-bold sm:text-4xl">
          The draft order your league can actually trust.
        </h2>
      </div>
      <div>
        <Eyebrow>League details</Eyebrow>
        <h2 className="font-display text-chalk mt-2 text-2xl font-bold">Gridiron Goons Dynasty</h2>
      </div>
      <div>
        <Eyebrow tone="muted">Started</Eyebrow>
        <p className="text-chalk mt-1">Apr 15, 2026, 7:04 PM</p>
      </div>
    </div>
  ),
};
