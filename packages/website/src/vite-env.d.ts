/// <reference types="vite/client" />

// Type declarations for raw imports
declare module '*?raw' {
  const content: string;
  export default content;
}

// Type declarations for other Vite import suffixes
declare module '*?url' {
  const url: string;
  export default url;
}

declare module '*?inline' {
  const content: string;
  export default content;
}
