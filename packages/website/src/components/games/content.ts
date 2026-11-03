// Shared with the structured data in app/games/page.tsx: an FAQPage or HowTo that disagrees with the
// visible copy is a violation, so both read these.
import { Code2, Settings2, Smartphone, Sparkles, Volume2, Zap } from "lucide-react";

export const FEATURES = [
  {
    icon: Zap,
    title: "Native engine speed",
    body: "Rendered by the Nayan Game Engine: Rust and wgpu on iOS and Android, WebAssembly with WebGPU or WebGL2 in browsers.",
  },
  {
    icon: Smartphone,
    title: "Apps and websites",
    body: "One package for Expo development builds and React websites, with keyboard play on the web.",
  },
  {
    icon: Sparkles,
    title: "Complete game screens",
    body: "Scoreboard, Start/Stop, results card, loading screen and particle effects come with every game.",
  },
  {
    icon: Volume2,
    title: "Sound and haptics",
    body: "Engine-mixed sound effects and native haptics, muted while paused or in the background.",
  },
  {
    icon: Settings2,
    title: "One settings model",
    body: "The same GameSettings, settings modal, light and dark themes and pause prop for every game.",
  },
  {
    icon: Code2,
    title: "Developer friendly",
    body: "TypeScript props, one onEndGame report per run, and only the game you open is loaded.",
  },
];

export const STEPS = [
  {
    title: "Install",
    body: "Add @nayan-ui/games and @nayan-ui/engine to an Expo development build or a React website.",
  },
  {
    title: "Render a game",
    body: "Each game is one component. Load any of them by id with a single game screen.",
  },
  {
    title: "Pass your settings",
    body: "Sounds, haptics, theme and pause come from your app, so every game follows them.",
  },
  {
    title: "Get the result",
    body: "onEndGame reports win, lose or cancel with the score, once per run.",
  },
];

export const FAQS = [
  {
    q: "Are the games free?",
    a: "They are free for non-commercial use. Commercial use needs a paid licence; see Licensing.",
  },
  {
    q: "Which platforms do they run on?",
    a: "iOS and Android through an Expo development build or a bare React Native app, and React websites such as Next.js and Vite. Expo Go does not include the engine.",
  },
  {
    q: "How do I add one game to my app?",
    a: "Install the package, then render the game's component with GameProps. The Installation guide shows a single-game screen and a catalog that loads any game by id.",
  },
  {
    q: "Can I build my own game the same way?",
    a: "Yes. Build a game documents the screen, constants, game and scene files every game in the library follows, on top of the Nayan Game Engine.",
  },
];
