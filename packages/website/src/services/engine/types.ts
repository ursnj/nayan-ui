export interface EngineExample {
  title: string;
  platform: "shared" | "react" | "native" | "shell";
  code: string;
  language?: string;
}
export interface EngineSection {
  id: string;
  title: string;
  paragraphs: string[];
  examples?: EngineExample[];
  table?: { headers: string[]; rows: string[][] };
  note?: string;
}
export interface EngineGuide {
  slug: string;
  title: string;
  description: string;
  sections: EngineSection[];
}
