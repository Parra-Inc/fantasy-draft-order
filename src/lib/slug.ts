import { customAlphabet } from "nanoid";

const COLORS = [
  "ochre", "amber", "cobalt", "crimson", "emerald", "indigo", "jade",
  "onyx", "scarlet", "silver", "teal", "violet", "ivory", "azure",
];
const ANIMALS = [
  "falcon", "grizzly", "lynx", "mustang", "otter", "panther", "raven",
  "stingray", "tiger", "wolf", "eagle", "bison", "puma", "kraken",
];

const suffix = customAlphabet("23456789abcdefghjkmnpqrstvwxyz", 4);

export function generateSlug(): string {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${color}-${animal}-${suffix()}`;
}
