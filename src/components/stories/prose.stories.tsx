import type { Meta, StoryObj } from "@storybook/react-vite";
import { GuideRenderer } from "@/components/marketing/guide-renderer";
import type { GuideSection } from "@/lib/seo/guides";

/**
 * Long-form article styles. There is no typography plugin installed, so
 * every heading, list and quote weight in a guide comes from
 * `GuideRenderer` (`src/components/marketing/guide-renderer.tsx`) directly:
 * this story renders it with a real excerpt rather than restating the
 * classes, so the two can never drift apart.
 */
const meta = {
  title: "Components/Prose",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const sections: GuideSection[] = [
  {
    kind: "p",
    text: 'Every fantasy draft randomizer says the same thing on its homepage: "unbiased," "random," "fair." Almost none of them give you a way to check. Here is what fairness actually means, and the four tests a tool either passes or fails.',
  },
  { kind: "h2", text: "Test 1: Is the algorithm public?" },
  {
    kind: "p",
    text: "If the randomizer is closed source, the only thing you have is the company's word. [The shuffle in this app](/how-it-works) is a plain Fisher-Yates over `node:crypto`, and every draft links to the exact commit that produced it.",
  },
  {
    kind: "ul",
    items: [
      "The shuffling code is published somewhere you can read it.",
      "The commit that ran is named on the results page, not just the repo.",
      "The seed and the order can both be checked after the fact.",
    ],
  },
  { kind: "h3", text: "What this does not require" },
  {
    kind: "quote",
    text: "You do not need to read the code to trust the draw. You need to know that someone could, and that the person who ran it could not have stopped them.",
    cite: "How it works",
  },
  {
    kind: "callout",
    tone: "trust",
    text: "This is the same standard the punishment wheel holds itself to: same shuffle, same commit link, same audit trail.",
  },
];

export const Article: Story = {
  render: () => (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <GuideRenderer sections={sections} />
    </article>
  ),
};
