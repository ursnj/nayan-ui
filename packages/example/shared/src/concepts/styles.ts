import { compileUtilities } from "@nayan-ui/engine/styles";

const result = compileUtilities([
  "p-4",
  "gap-2",
  "md:grid-cols-2",
  "hover:bg-accent",
  "text-foreground",
]);
if (result.unsupported.length)
  throw new Error(`Unsupported classes: ${result.unsupported.join(", ")}`);
console.log(JSON.stringify(result, null, 2));
