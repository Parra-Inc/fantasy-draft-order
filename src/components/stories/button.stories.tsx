import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * One filled (signal green) button per screen. Everything else is outline
 * or ghost: signal is the site's one action color, reserved for the thing you
 * actually want clicked (create the draft, send the invite).
 */
const meta = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "padded" },
  args: { children: "Create draft →", variant: "primary", size: "md" },
  argTypes: {
    variant: { control: "select", options: ["primary", "outline", "ghost"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Primary is the one filled button; outline and ghost never carry the fill. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Create draft →</Button>
      <Button variant="outline">Preview</Button>
      <Button variant="ghost">Cancel</Button>
    </div>
  ),
};

/** md (h-11) is the default and matches the field height; lg is for hero CTAs, sm for row actions. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Preview</Button>
      <Button size="md">Create draft</Button>
      <Button size="lg">Schedule the draw</Button>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Sparkles className="size-4" />
        Import league
      </Button>
      <Button variant="outline">
        <Users className="size-4" />
        Manual entry
      </Button>
    </div>
  ),
};

/** Disabled is opacity only, so the variant still reads through it. */
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled>Creating…</Button>
      <Button variant="outline" disabled>
        Preview
      </Button>
    </div>
  ),
};

/** The same classes on an anchor, for the header CTA and every marketing page's "Schedule the draw" link. */
export const AsLink: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button href="/new" size="lg">
        Schedule the draw
      </Button>
      <Button href="/how-it-works" variant="outline" size="lg">
        See how it works
      </Button>
    </div>
  ),
};
