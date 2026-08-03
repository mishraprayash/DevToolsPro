export interface SchemaOptions {
  requireAllFields: boolean;
  draftVersion: 'draft-07' | 'draft-2020-12';
}

export type SchemaResult =
  | { success: true; code: string }
  | { success: false; error: string };

interface JsonSchemaNode {
  type?: string;
  format?: string;
  items?: JsonSchemaNode | { anyOf: JsonSchemaNode[] };
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
}

function generateFieldSchema(val: unknown, options: SchemaOptions): JsonSchemaNode {
  if (val === null) {
    return { type: 'null' };
  }

  const type = typeof val;

  if (type === 'boolean') {
    return { type: 'boolean' };
  }
  if (type === 'string') {
    const strVal = val as string;
    const schema: JsonSchemaNode = { type: 'string' };
    
    // Quick regex formats detection
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/i.test(strVal)) {
      schema.format = 'date-time';
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
      schema.format = 'email';
    } else if (/^https?:\/\/\S+$/i.test(strVal)) {
      schema.format = 'uri';
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) {
      schema.format = 'date';
    }
    
    return schema;
  }
  if (type === 'number') {
    return { type: Number.isInteger(val) ? 'integer' : 'number' };
  }

  if (Array.isArray(val)) {
    if (val.length === 0) {
      return { type: 'array', items: {} };
    }
    
    const itemSchemas = val.map(item => generateFieldSchema(item, options));
    
    const firstStringified = JSON.stringify(itemSchemas[0]);
    const allIdentical = itemSchemas.every(s => JSON.stringify(s) === firstStringified);
    
    if (allIdentical) {
      return { type: 'array', items: itemSchemas[0] };
    } else {
      return { 
        type: 'array', 
        items: { anyOf: itemSchemas.filter((v, i, self) => self.findIndex(t => JSON.stringify(t) === JSON.stringify(v)) === i) } 
      };
    }
  }

  if (type === 'object' && val !== null) {
    const properties: Record<string, JsonSchemaNode> = {};
    const required: string[] = [];
    const obj = val as Record<string, unknown>;

    for (const key of Object.keys(obj)) {
      const propValue = obj[key];
      properties[key] = generateFieldSchema(propValue, options);
      if (options.requireAllFields) {
        required.push(key);
      }
    }

    const schema: JsonSchemaNode = {
      type: 'object',
      properties
    };

    if (required.length > 0) {
      schema.required = required;
    }

    return schema;
  }

  return {};
}

export function generateJsonSchema(jsonStr: string, options: Partial<SchemaOptions> = {}): SchemaResult {
  const opts: SchemaOptions = {
    requireAllFields: true,
    draftVersion: 'draft-07',
    ...options
  };

  try {
    const parsed = JSON.parse(jsonStr);
    const rootSchema = generateFieldSchema(parsed, opts);
    
    const draftUri = opts.draftVersion === 'draft-2020-12' 
      ? 'https://json-schema.org/draft/2020-12/schema' 
      : 'http://json-schema.org/draft-07/schema#';
      
    const finalSchema = {
      $schema: draftUri,
      title: 'GeneratedSchema',
      ...rootSchema
    };

    return {
      success: true,
      code: JSON.stringify(finalSchema, null, 2)
    };
  } catch (e) {
    return {
      success: false,
      error: `Invalid JSON payload: ${(e as Error).message}`
    };
  }
}
