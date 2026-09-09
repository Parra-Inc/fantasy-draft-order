import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/button";
import { Checkbox, CheckRow, Field, Input, Radio, Select, Textarea } from "@/components/ui/field";

/**
 * Every text-like control shares the app's `.input` class, now with an
 * explicit min-height of h-11 (44px) so it lines up with `Button` md on the
 * same row. `Select` strips the native dropdown chrome that `.input` alone
 * left in place (no chevron, browser-drawn arrow).
 */
const meta = {
  title: "Components/Form controls",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextField: Story = {
  render: () => (
    <div className="grid max-w-md gap-5">
      <Field label="League name" hint="Shown on the draft page and every share card">
        <Input defaultValue="Gridiron Goons Dynasty" />
      </Field>
      <Field label="League ID">
        <Input placeholder="123456789012345678" />
      </Field>
      <Field label="Commissioner email" hint="Optional, if you want a reply">
        <Input type="email" placeholder="you@example.com" />
      </Field>
      <Field label="Share link">
        <Input defaultValue="https://fantasyfootballdraftorder.com/d/red-zone-royals" disabled />
      </Field>
    </div>
  ),
};

export const Textarea_: Story = {
  name: "Textarea",
  render: () => (
    <div className="max-w-md">
      <Field label="Team names" hint="one per line · min 2">
        <Textarea
          rows={6}
          className="font-mono"
          defaultValue={"Gridiron Goons\nBlitz Brigade\nRed Zone Royals\nEnd Zone Enforcers"}
        />
      </Field>
    </div>
  ),
};

export const SelectControl: Story = {
  name: "Select",
  render: () => (
    <div className="grid max-w-md gap-5">
      <Field label="Platform">
        <Select defaultValue="SLEEPER">
          <option value="SLEEPER">Sleeper</option>
          <option value="MFL">MyFantasyLeague</option>
          <option value="FLEAFLICKER">Fleaflicker</option>
          <option value="ESPN">ESPN (public)</option>
        </Select>
      </Field>
      <Field label="Feedback type">
        <Select defaultValue="BUG">
          <option value="BUG">Bug</option>
          <option value="FEATURE">Feature request</option>
          <option value="PRAISE">Praise</option>
          <option value="OTHER">Other</option>
        </Select>
      </Field>
      <Field label="Punishment category">
        <Select defaultValue="" disabled>
          <option value="">Loading categories…</option>
        </Select>
      </Field>
    </div>
  ),
};

/**
 * The drift check: a select beside a text input beside a button, all on one
 * row. Same height, same background, same border. Before this pass the
 * select used the same `.input` class but no chevron and a browser-native
 * dropdown arrow, and `.input`'s min-height (42px) was two pixels short of
 * Button md (44px), both fixed here: `.input` in globals.css, and the
 * chevron in `Select`.
 */
export const MixedRow: Story = {
  render: () => (
    <div className="grid max-w-xl gap-6">
      <div className="flex items-center gap-2">
        <Input placeholder="League ID" className="flex-1" />
        <Select defaultValue="SLEEPER" className="w-40">
          <option value="SLEEPER">Sleeper</option>
          <option value="MFL">MFL</option>
          <option value="FLEAFLICKER">Fleaflicker</option>
          <option value="ESPN">ESPN</option>
        </Select>
        <Button size="md">Preview</Button>
      </div>
      <div className="flex items-center gap-2">
        <Input defaultValue="Priya Natarajan" className="flex-1" />
        <Select defaultValue="" className="w-44">
          <option value="">Seed position…</option>
          <option value="1">1st pick</option>
          <option value="2">2nd pick</option>
        </Select>
      </div>
    </div>
  ),
};

export const CheckboxControl: Story = {
  name: "Checkbox",
  render: () => (
    <div className="grid max-w-md gap-4">
      <CheckRow
        control={<Checkbox defaultChecked />}
        label="Auto-import team logos"
        hint="Pulls each manager's avatar from the platform, when one is set"
      />
      <CheckRow control={<Checkbox />} label="Send me a reminder before the draw" />
      <CheckRow control={<Checkbox defaultChecked />} label="List this draft's guide links" />
      <CheckRow
        control={<Checkbox disabled />}
        label="Auto-post to league Discord"
        hint="Coming once Discord auth ships"
      />
    </div>
  ),
};

export const RadioControl: Story = {
  name: "Radio",
  render: () => (
    <fieldset className="grid max-w-md gap-3">
      <legend className="text-chalk mb-1 text-sm font-medium">Where the teams come from</legend>
      <CheckRow
        control={<Radio name="mode" defaultChecked />}
        label="Import league"
        hint="Sleeper, MFL, Fleaflicker or public ESPN"
      />
      <CheckRow control={<Radio name="mode" />} label="Manual entry" hint="Type or paste team names, one per line" />
      <CheckRow control={<Radio name="mode" disabled />} label="Clone a previous draw" hint="Reuse a roster from an earlier draft" />
    </fieldset>
  ),
};

function ImportToggleDemo() {
  const [manual, setManual] = useState(false);
  return (
    <div className="grid max-w-md gap-4">
      <CheckRow
        control={<Checkbox checked={manual} onChange={(e) => setManual(e.target.checked)} />}
        label="Enter teams manually"
        hint="Skips the platform import below"
      />
      <div className={manual ? "opacity-50" : ""}>
        <Field label="Platform">
          <Select disabled={manual} defaultValue="SLEEPER">
            <option value="SLEEPER">Sleeper</option>
            <option value="MFL">MyFantasyLeague</option>
          </Select>
        </Field>
      </div>
    </div>
  );
}

/** The one interactive story: the same manual/import switch the new-draft form uses. */
export const Toggle: Story = {
  render: () => <ImportToggleDemo />,
};
