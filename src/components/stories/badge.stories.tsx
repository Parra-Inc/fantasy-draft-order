import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * The three states a draft or a punishment wheel can be in: scheduled,
 * drawing, complete. Signal green is reused for both "drawing live" and
 * "complete" because both mean the same thing to a viewer: the order can be
 * trusted, watch it or read it. Each state carries a word and usually an icon,
 * never color alone.
 */
const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: { layout: "padded" },
  args: { children: "Scheduled", tone: "neutral" },
  argTypes: {
    tone: { control: "select", options: ["neutral", "live", "complete", "warning", "destructive"] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge tone="neutral" icon={<Calendar className="size-3" />}>
        Scheduled
      </Badge>
      <Badge tone="live">
        <span className="relative flex size-1.5">
          <span className="bg-signal absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
          <span className="bg-signal relative inline-flex size-1.5 rounded-full" />
        </span>
        Drawing live
      </Badge>
      <Badge tone="complete" icon={<Trophy className="size-3" />}>
        Complete
      </Badge>
      <Badge tone="warning">Read this first</Badge>
      <Badge tone="destructive">Invalid league ID</Badge>
    </div>
  ),
};
