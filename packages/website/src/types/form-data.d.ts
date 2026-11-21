import "next/server";

declare module "next/server" {
  interface NextRequest {
    // React Native's shared declarations also define FormData. Next uses the web implementation.
    formData(): Promise<{
      get(name: string): FormDataEntryValue | null;
      getAll(name: string): FormDataEntryValue[];
    }>;
  }
}
