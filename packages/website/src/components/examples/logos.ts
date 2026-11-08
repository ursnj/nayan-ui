export const LOGOS = [
  {
    id: "microsoft",
    name: "Microsoft",
    description: "Tiles glide inward from four corners and settle into the window.",
  },
  {
    id: "google",
    name: "Google",
    description: "Colored arcs sweep around the center, then the crossbar extends.",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Capsules slide along their axes while dots pop into the gaps.",
  },
  {
    id: "netflix",
    name: "Netflix",
    description: "Two upright ribbons extend upward before the diagonal ribbon stretches across.",
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "The green disc opens and sound waves expand from its center, then gently pulse.",
  },
  {
    id: "cisco",
    name: "Cisco",
    description: "Bridge bars grow in a wave, then respond like an audio equalizer.",
  },
  {
    id: "adidas",
    name: "Adidas",
    description: "Three stripes grow diagonally from their baseline in ascending order.",
  },
  {
    id: "audi",
    name: "Audi",
    description: "Silver rings glide in from alternating sides and interlock.",
  },
  {
    id: "mastercard",
    name: "Mastercard",
    description: "Two circles slide together and their orange intersection opens between them.",
  },
  {
    id: "target",
    name: "Target",
    description: "The outer ring zooms into focus and the center lands with a small bounce.",
  },
  {
    id: "mitsubishi",
    name: "Mitsubishi",
    description: "Three diamonds follow short circular paths and lock into a shared center.",
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "The red badge expands like a button and its play triangle slides into place.",
  },
  {
    id: "figma",
    name: "Figma",
    description: "Five modules drop into their slots with a gentle snap and bounce.",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Four box flaps unfold in 3D and the base drops underneath them.",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "The blue badge grows upward and the white letterforms lift from its baseline.",
  },
  {
    id: "nike",
    name: "Nike",
    description: "The swoosh draws across the screen from its heel to its tip.",
  },
  {
    id: "mercedes",
    name: "Mercedes-Benz",
    description: "A silver ring turns toward the viewer as the star rotates into alignment.",
  },
  {
    id: "bmw",
    name: "BMW",
    description: "The rim turns forward while four colored quadrants rotate into their slots.",
  },
] as const;

export type LogoId = (typeof LOGOS)[number]["id"];
