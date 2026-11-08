export const LOGOS = [
  {
    id: "microsoft",
    name: "Microsoft",
    description: "Four colored tiles spin into a familiar window.",
  },
  {
    id: "google",
    name: "Google",
    description: "Four colored arcs and a crossbar assemble into the Google G.",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Colorful capsules and dots slide together into Slack’s mark.",
  },
  {
    id: "netflix",
    name: "Netflix",
    description: "Three red ribbons come together to form the Netflix N.",
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Three curved sound waves settle onto Spotify’s green disc.",
  },
  { id: "cisco", name: "Cisco", description: "Nine blue bars rise into Cisco’s bridge symbol." },
  {
    id: "adidas",
    name: "Adidas",
    description: "Three rising stripes assemble into the Adidas performance mark.",
  },
  { id: "audi", name: "Audi", description: "Four silver rings slide together into Audi’s emblem." },
  {
    id: "mastercard",
    name: "Mastercard",
    description: "Red and yellow circles meet in Mastercard’s orange center.",
  },
  {
    id: "target",
    name: "Target",
    description: "A red ring and center align into Target’s bullseye.",
  },
  {
    id: "mitsubishi",
    name: "Mitsubishi",
    description: "Three red diamonds converge into Mitsubishi’s emblem.",
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "A white play triangle lands on YouTube’s red badge.",
  },
  {
    id: "figma",
    name: "Figma",
    description: "Five colorful modules connect into the Figma symbol.",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Blue diamonds fold together into Dropbox’s open box.",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "White letterforms assemble on LinkedIn’s blue square.",
  },
  { id: "nike", name: "Nike", description: "The Nike swoosh spins into place in bright white." },
  {
    id: "mercedes",
    name: "Mercedes-Benz",
    description: "A silver three-pointed star settles inside its ring.",
  },
  {
    id: "bmw",
    name: "BMW",
    description: "Blue and white quadrants assemble into BMW’s circular symbol.",
  },
] as const;

export type LogoId = (typeof LOGOS)[number]["id"];
