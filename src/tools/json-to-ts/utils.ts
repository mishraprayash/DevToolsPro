export interface JsonToTsOptions {
  rootName: string;
  useInterface: boolean;
  nestedMode: 'extract' | 'inline';
  makeOptional: boolean;
  addExport: boolean;
}

export interface ConversionResult {
  success: boolean;
  code: string;
  error?: string;
}

function toPascalCase(str: string): string {
  const clean = str.replace(/[^a-zA-Z0-9_]/g, '_');
  return clean
    .split('_')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function getSafeRootName(name: string): string {
  const parsed = toPascalCase(name);
  return parsed || 'RootObject';
}

function getSingularName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('list') && name.length > 4) {
    return name.slice(0, -4);
  }
  if (lower.endsWith('data') && name.length > 4) {
    return name;
  }
  if (lower.endsWith('ies')) {
    return name.slice(0, -3) + 'y';
  }
  if (lower.endsWith('es') && !lower.endsWith('ses') && !lower.endsWith('xes') && !lower.endsWith('ches') && !lower.endsWith('shes')) {
    return name.slice(0, -1);
  }
  if (lower.endsWith('s') && !lower.endsWith('ss') && !lower.endsWith('is') && !lower.endsWith('us') && !lower.endsWith('as')) {
    return name.slice(0, -1);
  }
  return name;
}

function mergeObjects(objects: unknown[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  const allKeys = new Set<string>();

  for (const obj of objects) {
    if (obj !== null && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        allKeys.add(key);
      }
    }
  }

  for (const key of allKeys) {
    const values = objects
      .map(o => (o !== null && typeof o === 'object' ? (o as Record<string, unknown>)[key] : undefined))
      .filter(v => v !== undefined);

    if (values.length === 0) continue;

    const objectValues = values.filter(v => typeof v === 'object' && v !== null && !Array.isArray(v));
    const arrayValues = values.filter(v => Array.isArray(v));

    if (objectValues.length > 0) {
      merged[key] = mergeObjects(objectValues);
    } else if (arrayValues.length > 0) {
      const combinedArray: unknown[] = [];
      for (const arr of arrayValues) {
        combinedArray.push(...(arr as unknown[]));
      }
      merged[key] = combinedArray;
    } else {
      merged[key] = values.find(v => v !== null) ?? null;
    }
  }

  return merged;
}

function generateType(
  val: unknown,
  currentKeyName: string,
  opts: JsonToTsOptions,
  extractedTypes: Map<string, string>
): string {
  if (val === null) {
    return 'any';
  }

  const typeStr = typeof val;
  if (typeStr === 'string' || typeStr === 'number' || typeStr === 'boolean') {
    return typeStr;
  }

  if (Array.isArray(val)) {
    if (val.length === 0) {
      return 'any[]';
    }

    const itemTypes = new Set<string>();
    const objectItems: unknown[] = [];
    
    for (const item of val) {
      if (typeof item === 'object' && item !== null) {
        objectItems.push(item);
      } else {
        itemTypes.add(generateType(item, currentKeyName, opts, extractedTypes));
      }
    }

    if (objectItems.length > 0) {
      const mergedObj = mergeObjects(objectItems);
      const singularName = getSingularName(currentKeyName);
      const objType = generateType(mergedObj, singularName, opts, extractedTypes);
      itemTypes.add(objType);
    }

    const typesArray = Array.from(itemTypes);
    if (typesArray.length === 1) {
      const inner = typesArray[0];
      if (inner.includes('|') || inner.includes('=>') || (inner.startsWith('{') && inner.endsWith('}'))) {
        return `(${inner})[]`;
      }
      return `${inner}[]`;
    } else {
      return `(${typesArray.join(' | ')})[]`;
    }
  }

  if (typeof val === 'object' && val !== null) {
    const fields: string[] = [];
    const keys = Object.keys(val);
    const exportKw = opts.addExport ? 'export ' : '';

    for (const key of keys) {
      const propValue = (val as Record<string, unknown>)[key];
      const isOptional = opts.makeOptional || propValue === null;
      const cleanKeyName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      
      const subTypeName = toPascalCase(currentKeyName) + toPascalCase(key);
      const propType = generateType(propValue, subTypeName, opts, extractedTypes);

      fields.push(`  ${cleanKeyName}${isOptional ? '?' : ''}: ${propType};`);
    }

    const struct = `{\n${fields.join('\n')}\n}`;

    if (opts.nestedMode === 'extract') {
      const typeName = toPascalCase(currentKeyName);
      
      let finalTypeName = typeName;
      let counter = 1;
      while (extractedTypes.has(finalTypeName)) {
        const existing = extractedTypes.get(finalTypeName);
        if (existing?.includes(struct)) {
          break;
        }
        finalTypeName = `${typeName}${counter}`;
        counter++;
      }

      if (!extractedTypes.has(finalTypeName)) {
        let typeDef = '';
        if (opts.useInterface) {
          typeDef = `${exportKw}interface ${finalTypeName} ${struct}`;
        } else {
          typeDef = `${exportKw}type ${finalTypeName} = ${struct};`;
        }
        extractedTypes.set(finalTypeName, typeDef);
      }

      return finalTypeName;
    }

    return struct;
  }

  return 'any';
}

export function jsonToTs(jsonStr: string, options: Partial<JsonToTsOptions> = {}): ConversionResult {
  const opts: JsonToTsOptions = {
    rootName: 'RootObject',
    useInterface: true,
    nestedMode: 'extract',
    makeOptional: false,
    addExport: true,
    ...options
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    return {
      success: false,
      code: '',
      error: `Invalid JSON: ${(e as Error).message}`
    };
  }

  const extractedTypes = new Map<string, string>();
  const safeRootName = getSafeRootName(opts.rootName);

  try {
    const mainType = generateType(parsed, safeRootName, opts, extractedTypes);
    let output = '';

    if (opts.nestedMode === 'extract') {
      for (const [name, definition] of extractedTypes.entries()) {
        if (name !== safeRootName) {
          output += definition + '\n\n';
        }
      }
    }

    if (opts.nestedMode === 'extract' && (typeof parsed === 'object' && parsed !== null)) {
      output += extractedTypes.get(safeRootName) || '';
    } else {
      const exportKw = opts.addExport ? 'export ' : '';
      if (opts.useInterface && typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        output += `${exportKw}interface ${safeRootName} ${mainType}`;
      } else {
        output += `${exportKw}type ${safeRootName} = ${mainType};`;
      }
    }

    return {
      success: true,
      code: output.trim()
    };
  } catch (e) {
    return {
      success: false,
      code: '',
      error: `Conversion error: ${(e as Error).message}`
    };
  }
}
