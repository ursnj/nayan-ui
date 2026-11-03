export interface EngineExample {
  title: string;
  /** When to run this example and the result to expect. */
  description?: string;
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
