export const APP_TITLE = "Nayan Engine Examples";

export const carRacing = {
  id: "car-racing",
  title: "Car Racing",
  description: "Play a complete 3D game with traffic, sound, settings, and a scoreboard.",
} as const;

export const conceptGroups = [
  {
    title: "Game engine",
    examples: [
      {
        id: "world",
        title: "World and entities",
        description: "Spawn, update, and remove an entity on a 3D surface.",
      },
      {
        id: "game-loop",
        title: "Game loop",
        description: "Use frame delta and batched transforms to move a cube.",
      },
      {
        id: "physics",
        title: "Physics and collisions",
        description: "Drop a bouncing ball and count its contacts with the floor.",
      },
      {
        id: "entity-animation",
        title: "Entity and character animation",
        description: "Tween an entity and play a bundled glTF clip.",
      },
      {
        id: "effects",
        title: "Particle effects",
        description: "Trigger confetti and a particle burst in world space.",
      },
      {
        id: "input",
        title: "Pointer and touch input",
        description: "Tap to pick a tile or swipe to move it.",
      },
      {
        id: "game-assets",
        title: "Models, textures, and fonts",
        description: "Load the racing model, an asphalt texture, and an Inter font.",
      },
      {
        id: "score-and-timers",
        title: "Score and timers",
        description: "Score points against the world clock and pause or restart.",
      },
      {
        id: "shapes",
        title: "Procedural shapes",
        description: "Revolve a profile to build a reusable vase mesh.",
      },
      {
        id: "terrain",
        title: "Procedural terrain",
        description: "Generate a seeded terrain mesh from a field graph.",
      },
      {
        id: "board",
        title: "Flat boards and colors",
        description: "Pick cells in an orthographic board with a flat light.",
      },
      {
        id: "performance",
        title: "Performance and quality",
        description: "Compare quality settings and inspect live frame statistics.",
      },
      {
        id: "drawing",
        title: "Drawing",
        description: "Paint with Rust-backed strokes, undo, redo, and export SVG.",
      },
      {
        id: "core",
        title: "Core initialization",
        description: "Prepare the Rust core without starting the 3D renderer.",
      },
    ],
  },
  {
    title: "Components",
    examples: [
      {
        id: "theme",
        title: "Theme and layout",
        description: "Switch palettes and render semantic colors in an engine page.",
      },
      {
        id: "system-bars",
        title: "System bars",
        description: "Change native status-bar visibility and restore it when leaving.",
      },
      {
        id: "controls",
        title: "Controls and selection",
        description: "Try switches, multiple selection, and accessible content controls.",
      },
      {
        id: "forms",
        title: "Forms and keyboard",
        description: "Edit text, select a value, and submit controlled form data.",
      },
      {
        id: "feedback",
        title: "Feedback and confetti",
        description: "Show a toast, progress, loading, and a celebration.",
      },
      {
        id: "presentation",
        title: "Sheets and dialogs",
        description: "Open a details sheet and confirm an action.",
      },
      {
        id: "list",
        title: "Virtualized lists",
        description: "Scroll a thousand rows or jump directly to a row.",
      },
      {
        id: "carousel",
        title: "Carousel and backgrounds",
        description: "Swipe between patterned cards with page indicators.",
      },
      {
        id: "drawer",
        title: "Side drawer",
        description: "Open and close a drawer around the platform view.",
      },
      {
        id: "safe-area",
        title: "Safe areas",
        description: "Inspect system insets and apply edge padding.",
      },
      {
        id: "interop",
        title: "Platform interop, icons, and blur",
        description: "Embed an ordinary platform view and render standalone controls.",
      },
      {
        id: "view-animation",
        title: "View animation",
        description: "Animate shared values and replay a preset on a platform view.",
      },
      {
        id: "shared-element",
        title: "Shared element transition",
        description: "Measure a card before moving it to a different layout.",
      },
      {
        id: "markdown",
        title: "Markdown",
        description: "Parse JSON frontmatter and render a formatted article.",
      },
    ],
  },
  {
    title: "Local data",
    examples: [
      {
        id: "assets",
        title: "Bundled assets",
        description: "Read a bundled model as bytes and inspect its metadata.",
      },
      {
        id: "files",
        title: "Private and temporary files",
        description: "Write, read, list, and clean up example files.",
      },
      {
        id: "storage",
        title: "Application storage",
        description: "Persist a counter and reset its namespaced storage.",
      },
      {
        id: "sqlite",
        title: "SQLite",
        description: "Create a table, insert bound values, and query rows in memory.",
      },
      { id: "uuid", title: "UUIDs", description: "Generate a secure version 4 identifier." },
    ],
  },
  {
    title: "Device and media",
    examples: [
      {
        id: "network",
        title: "Connectivity",
        description: "Observe the platform’s online state as it changes.",
      },
      {
        id: "permissions",
        title: "Permissions",
        description: "Inspect permission states and request camera access on demand.",
      },
      {
        id: "location",
        title: "Location",
        description: "Request and display a single foreground location fix.",
      },
      {
        id: "device",
        title: "Device environment",
        description: "Inspect whether the demo is running on a device, simulator, or browser.",
      },
      { id: "audio", title: "Audio playback", description: "Play and stop a bundled WAV clip." },
      {
        id: "microphone",
        title: "Microphone",
        description: "Record a short take and play it back.",
      },
      {
        id: "speech",
        title: "System speech",
        description: "Speak a sample sentence, stop, or inspect the available voices.",
      },
      {
        id: "haptics",
        title: "Haptics",
        description: "Try impact and success feedback on supported hardware.",
      },
      {
        id: "video",
        title: "Video",
        description: "Play a small bundled clip with the platform’s video controls.",
      },
      { id: "camera", title: "Camera", description: "Take a photo and inspect its dimensions." },
      {
        id: "image-picker",
        title: "Image picker",
        description: "Select and crop a library image.",
      },
      {
        id: "capture",
        title: "Screen capture",
        description: "Capture a permitted screen and inspect the resulting PNG.",
      },
      {
        id: "clipboard",
        title: "Clipboard",
        description: "Write sample text and paste the current clipboard text.",
      },
      {
        id: "sharing",
        title: "Sharing",
        description: "Open the system share sheet with sample text.",
      },
      {
        id: "keep-awake",
        title: "Keep awake",
        description: "Hold a wake lock while the demo is active.",
      },
      {
        id: "review",
        title: "Store review",
        description: "Check availability and request a native store review.",
      },
    ],
  },
] as const;

type ConceptGroup = (typeof conceptGroups)[number];
export type Concept = ConceptGroup["examples"][number];
export type ConceptId = Concept["id"];

export function findConcept(id?: string) {
  for (const group of conceptGroups) {
    const example = group.examples.find((example) => example.id === id);
    if (example) return example;
  }
}
