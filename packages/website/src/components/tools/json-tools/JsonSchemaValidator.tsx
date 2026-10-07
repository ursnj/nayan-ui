"use client";

import { useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { NButton, NTextarea, NCard } from "@nayan-ui/react";

interface ValidationError {
  path: string;
  message: string;
}

function validateSchema(data: any, schema: any, path = "$"): ValidationError[] {
  const errors: ValidationError[] = [];

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actualType = Array.isArray(data) ? "array" : data === null ? "null" : typeof data;
    if (!types.includes(actualType) && !(actualType === "number" && types.includes("integer") && Number.isInteger(data))) {
      errors.push({ path, message: `Expected ${types.join("|")} but got ${actualType}` });
      return errors;
    }
  }

  if (schema.enum && !schema.enum.includes(data)) {
    errors.push({ path, message: `Value must be one of: ${JSON.stringify(schema.enum)}` });
  }

  if (typeof data === "string") {
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push({ path, message: `String length must be >= ${schema.minLength}` });
    }
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push({ path, message: `String length must be <= ${schema.maxLength}` });
    }
    if (schema.pattern) {
      try { if (!new RegExp(schema.pattern).test(data)) errors.push({ path, message: `Must match pattern: ${schema.pattern}` }); } catch { /* skip */ }
    }
  }

  if (typeof data === "number") {
    if (schema.minimum !== undefined && data < schema.minimum) errors.push({ path, message: `Must be >= ${schema.minimum}` });
    if (schema.maximum !== undefined && data > schema.maximum) errors.push({ path, message: `Must be <= ${schema.maximum}` });
  }

  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) errors.push({ path, message: `Array must have >= ${schema.minItems} items` });
    if (schema.maxItems !== undefined && data.length > schema.maxItems) errors.push({ path, message: `Array must have <= ${schema.maxItems} items` });
    if (schema.items) {
      data.forEach((item, i) => errors.push(...validateSchema(item, schema.items, `${path}[${i}]`)));
    }
  }

  if (data && typeof data === "object" && !Array.isArray(data)) {
    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in data)) errors.push({ path: `${path}.${key}`, message: "Required property missing" });
      }
    }
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) errors.push(...validateSchema(data[key], propSchema, `${path}.${key}`));
      }
    }
  }

  return errors;
}

const JsonSchemaValidator = () => {
  const [jsonInput, setJsonInput] = useState("");
  const [schemaInput, setSchemaInput] = useState("");

  const result = useMemo(() => {
    if (!jsonInput.trim() || !schemaInput.trim()) return null;
    try {
      const data = JSON.parse(jsonInput);
      let schema: any;
      try { schema = JSON.parse(schemaInput); } catch { return { errors: [], parseError: "Invalid JSON Schema syntax" }; }
      const errors = validateSchema(data, schema);
      return { errors, parseError: "" };
    } catch {
      return { errors: [], parseError: "Invalid JSON data syntax" };
    }
  }, [jsonInput, schemaInput]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NButton isOutline onClick={() => { setJsonInput(""); setSchemaInput(""); }}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </NButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <NTextarea
          label="JSON Data"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='{"name": "Alice", "age": 30}'
          textareaClassName="h-[250px] resize-none font-mono text-sm"
        />
        <NTextarea
          label="JSON Schema"
          value={schemaInput}
          onChange={(e) => setSchemaInput(e.target.value)}
          placeholder='{"type": "object", "required": ["name"], "properties": {"name": {"type": "string"}, "age": {"type": "integer", "minimum": 0}}}'
          textareaClassName="h-[250px] resize-none font-mono text-sm"
        />
      </div>

      {result?.parseError && <p className="mt-3 text-sm text-danger">{result.parseError}</p>}

      {result && !result.parseError && (
        <NCard className="mt-4 p-4">
          {result.errors.length === 0 ? (
            <p className="font-medium text-accent">✓ Valid — JSON data matches the schema</p>
          ) : (
            <>
              <label className="mb-2 block text-sm font-medium text-danger">
                ✗ {result.errors.length} validation error{result.errors.length !== 1 ? "s" : ""}
              </label>
              <div className="space-y-1">
                {result.errors.map((err, i) => (
                  <div key={i} className="rounded bg-default/30 px-3 py-2 text-sm">
                    <code className="text-xs text-muted">{err.path}</code>
                    <span className="ml-2 text-foreground">{err.message}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </NCard>
      )}
    </div>
  );
};

export default JsonSchemaValidator;
