import type { Meta, StoryObj } from "@storybook/react-vite";
import { Share2 } from "lucide-react";
import { Popover } from "@/components/popover";
import { Button } from "@/components/ui/button";

/**
 * The hand-rolled trigger-plus-panel used by the share menu on the results
 * page: one trigger, one panel, dismiss on outside click or Escape. No
 * portal, no z-index reasoning beyond the ancestor it sits in.
 */
const meta = {
  title: "Components/Popover",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <div className="flex justify-center py-16">
      <Popover
        label="Share options"
        trigger={
          <span className="border-sideline/60 bg-midnight/50 text-chalk hover:border-signal/40 inline-flex h-11 items-center gap-1.5 rounded-xl border px-5 text-sm font-semibold transition-colors">
            <Share2 className="size-4" />
            Share
          </span>
        }
      >
        {(close) => (
          <div className="grid gap-2">
            <Button variant="outline" size="sm" onClick={close} className="w-full justify-start">
              Copy link
            </Button>
            <Button variant="outline" size="sm" onClick={close} className="w-full justify-start">
              Download image
            </Button>
          </div>
        )}
      </Popover>
    </div>
  ),
};

/** `align="end"` right-aligns the panel to the trigger, used when the trigger sits near the right edge. */
export const AlignedEnd: Story = {
  render: () => (
    <div className="flex justify-end py-16">
      <Popover
        label="Share options"
        align="end"
        trigger={
          <span className="border-sideline/60 bg-midnight/50 text-chalk hover:border-signal/40 inline-flex h-11 items-center gap-1.5 rounded-xl border px-5 text-sm font-semibold transition-colors">
            <Share2 className="size-4" />
            Share
          </span>
        }
      >
        {() => <p className="text-hashmark text-sm">Panel aligned to the right edge of the trigger.</p>}
      </Popover>
    </div>
  ),
};
