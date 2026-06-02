export type JsonAction = 'beautify' | 'minify' | 'validate' | 'sort';

export function parseJson(input: string): { success: true; data: unknown } | { success: false; error: string } {
  try {
    const data = JSON.parse(input);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export function beautifyJson(input: string, indent: number = 2): string {
  const parsed = parseJson(input);
  if (!parsed.success) return input;
  return JSON.stringify(parsed.data, null, indent);
}

export function minifyJson(input: string): string {
  const parsed = parseJson(input);
  if (!parsed.success) return input;
  return JSON.stringify(parsed.data);
}

export function sortJsonKeys(input: string): string {
  const parsed = parseJson(input);
  if (!parsed.success) return input;
  
  const sortObject = (obj: unknown): unknown => {
    if (Array.isArray(obj)) {
      return obj.map(sortObject);
    }
    if (obj !== null && typeof obj === 'object') {
      const sorted: Record<string, unknown> = {};
      const keys = Object.keys(obj as Record<string, unknown>).sort();
      for (const key of keys) {
        sorted[key] = sortObject((obj as Record<string, unknown>)[key]);
      }
      return sorted;
    }
    return obj;
  };
  
  return JSON.stringify(sortObject(parsed.data), null, 2);
}

export function validateJson(input: string): { valid: boolean; error?: string; line?: number } {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e) {
    const error = e as SyntaxError;
    const match = error.message.match(/position (\d+)/);
    const position = match ? parseInt(match[1], 10) : undefined;
    const line = position !== undefined ? input.substring(0, position).split('\n').length : undefined;
    return { valid: false, error: error.message, line };
  }
}

export function processJson(input: string, action: JsonAction, indent: number = 2): string {
  switch (action) {
    case 'beautify':
      return beautifyJson(input, indent);
    case 'minify':
      return minifyJson(input);
    case 'sort':
      return sortJsonKeys(input);
    case 'validate':
      const result = validateJson(input);
      if (!result.valid) {
        throw new Error(result.error);
      }
      return input;
    default:
      return input;
  }
}

/**
 * Intelligent helper to repair common syntactic errors in invalid JSON payloads.
 */
export function repairJsonString(raw: string): { repaired: string; changes: string[] } {
  const changes: string[] = [];
  let s = raw.trim();

  // 1. Strip Markdown code block wrapping
  const mdMatch = s.match(/^```(?:json)?([\s\S]*?)```$/);
  if (mdMatch) {
    s = mdMatch[1].trim();
    changes.push("Stripped Markdown code block wrapping");
  }

  // 2. Strip JavaScript/TypeScript declarations
  const assignmentMatch = s.match(/^(?:export\s+default\s+|const\s+\w+\s*=\s*|let\s+\w+\s*=\s*|var\s+\w+\s*=\s*)([\s\S]+)$/);
  if (assignmentMatch) {
    s = assignmentMatch[1].trim();
    if (s.endsWith(';')) {
      s = s.slice(0, -1).trim();
    }
    changes.push("Stripped JavaScript variable assignment");
  }

  // 3. Extract root element if enclosed with garbage text
  const firstBrace = s.indexOf('{');
  const firstBracket = s.indexOf('[');
  const lastBrace = s.lastIndexOf('}');
  const lastBracket = s.lastIndexOf(']');

  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (lastBrace !== -1 && lastBracket !== -1) {
    endIdx = Math.max(lastBrace, lastBracket);
  } else if (lastBrace !== -1) {
    endIdx = lastBrace;
  } else if (lastBracket !== -1) {
    endIdx = lastBracket;
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const rawBefore = s;
    s = s.substring(startIdx, endIdx + 1);
    if (s !== rawBefore) {
      changes.push("Extracted JSON root element, discarding surrounding clutter");
    }
  }

  // Walk and scan
  let output = '';
  let i = 0;
  const len = s.length;

  let inString = false;
  let stringChar = ''; // ' or "
  let escaped = false;
  let wordBuffer = '';

  while (i < len) {
    const c = s[i];
    const next = s[i + 1] || '';

    if (inString) {
      if (escaped) {
        if (stringChar === '"' && c === "'") {
          output += "'";
        } else if (stringChar === "'" && c === '"') {
          output += '"';
        } else {
          output += '\\' + c;
        }
        escaped = false;
      } else if (c === '\\') {
        escaped = true;
      } else if (c === stringChar) {
        inString = false;
        if (stringChar === "'") {
          let content = wordBuffer;
          let escapedContent = '';
          for (let k = 0; k < content.length; k++) {
            const ch = content[k];
            if (ch === '"' && (k === 0 || content[k - 1] !== '\\')) {
              escapedContent += '\\"';
            } else {
              escapedContent += ch;
            }
          }
          output += `"${escapedContent}"`;
          wordBuffer = '';
          if (!changes.includes("Converted single quotes to double quotes")) {
            changes.push("Converted single quotes to double quotes");
          }
        } else {
          output += '"';
        }
      } else {
        if (stringChar === "'") {
          wordBuffer += c;
        } else {
          output += c;
        }
      }
      i++;
      continue;
    }

    // Stripping comments
    if (c === '/' && next === '/') {
      while (i < len && s[i] !== '\n') {
        i++;
      }
      if (!changes.includes("Removed comments")) {
        changes.push("Removed comments");
      }
      continue;
    }

    if (c === '/' && next === '*') {
      i += 2;
      while (i < len && !(s[i] === '*' && s[i + 1] === '/')) {
        i++;
      }
      i += 2;
      if (!changes.includes("Removed comments")) {
        changes.push("Removed comments");
      }
      continue;
    }

    if (c === '"' || c === "'") {
      inString = true;
      stringChar = c;
      escaped = false;
      wordBuffer = '';
      if (c === '"') {
        output += '"';
      }
      i++;
      continue;
    }

    const isAlphaNum = /[a-zA-Z0-9_$]/.test(c);
    if (isAlphaNum) {
      wordBuffer += c;
    } else {
      if (wordBuffer) {
        let tempI = i;
        while (tempI < len && /\s/.test(s[tempI])) {
          tempI++;
        }
        if (s[tempI] === ':') {
          output += `"${wordBuffer}"`;
          if (!changes.includes("Added double quotes to unquoted keys")) {
            changes.push("Added double quotes to unquoted keys");
          }
        } else {
          if (wordBuffer === 'True') {
            output += 'true';
            changes.push("Converted Python 'True' to JSON 'true'");
          } else if (wordBuffer === 'False') {
            output += 'false';
            changes.push("Converted Python 'False' to JSON 'false'");
          } else if (wordBuffer === 'None') {
            output += 'null';
            changes.push("Converted Python 'None' to JSON 'null'");
          } else if (wordBuffer === 'undefined') {
            output += 'null';
            changes.push("Converted 'undefined' to 'null'");
          } else {
            output += wordBuffer;
          }
        }
        wordBuffer = '';
      }

      // Trailing commas
      if (c === ',') {
        let tempI = i + 1;
        while (tempI < len && /\s/.test(s[tempI])) {
          tempI++;
        }
        if (s[tempI] === '}' || s[tempI] === ']') {
          if (!changes.includes("Removed trailing commas")) {
            changes.push("Removed trailing commas");
          }
          i++;
          continue;
        }
      }

      output += c;
    }

    i++;
  }

  if (wordBuffer) {
    if (wordBuffer === 'True') {
      output += 'true';
    } else if (wordBuffer === 'False') {
      output += 'false';
    } else if (wordBuffer === 'None') {
      output += 'null';
    } else {
      output += wordBuffer;
    }
  }

  // Secondary pass: missing commas and wrapping braces
  try {
    JSON.parse(output);
  } catch (err) {
    let repairedCommas = '';
    let inStr = false;
    let escapedStr = false;
    for (let k = 0; k < output.length; k++) {
      const ch = output[k];
      if (inStr) {
        if (escapedStr) {
          escapedStr = false;
        } else if (ch === '\\') {
          escapedStr = true;
        } else if (ch === '"') {
          inStr = false;
        }
        repairedCommas += ch;
      } else {
        if (ch === '"') {
          let prevI = repairedCommas.length - 1;
          while (prevI >= 0 && /\s/.test(repairedCommas[prevI])) {
            prevI--;
          }
          if (prevI >= 0) {
            const prevCh = repairedCommas[prevI];
            if (prevCh === '"' || prevCh === '}' || prevCh === ']' || /[0-9a-zA-Z]/.test(prevCh)) {
              repairedCommas += ', ';
              if (!changes.includes("Inserted missing commas")) {
                changes.push("Inserted missing commas");
              }
            }
          }
          inStr = true;
          repairedCommas += ch;
        } else if (ch === '{' || ch === '[') {
          let prevI = repairedCommas.length - 1;
          while (prevI >= 0 && /\s/.test(repairedCommas[prevI])) {
            prevI--;
          }
          if (prevI >= 0) {
            const prevCh = repairedCommas[prevI];
            if (prevCh === '"' || prevCh === '}' || prevCh === ']' || /[0-9a-zA-Z]/.test(prevCh)) {
              repairedCommas += ', ';
              if (!changes.includes("Inserted missing commas")) {
                changes.push("Inserted missing commas");
              }
            }
          }
          repairedCommas += ch;
        } else {
          repairedCommas += ch;
        }
      }
    }

    try {
      JSON.parse(repairedCommas);
      output = repairedCommas;
    } catch (e2) {
      const wrapped = '{' + output + '}';
      try {
        JSON.parse(wrapped);
        output = wrapped;
        changes.push("Wrapped object in enclosing curly braces");
      } catch (e3) {
        // use parsed output as-is, let primary parser fail
      }
    }
  }

  return { repaired: output, changes };
}

/**
 * Formats standard javascript objects/values into structured YAML format.
 */
export function jsonToYaml(val: unknown, depth: number = 0): string {
  const indent = '  '.repeat(depth);
  if (val === null) return 'null';
  if (val === undefined) return '';
  if (typeof val === 'string') {
    if (val.includes('\n')) {
      return '|\n' + val.split('\n').map(line => '  '.repeat(depth + 1) + line).join('\n');
    }
    if (val === '' || /[#:*?{}|>&!%@`]/.test(val) || val.trim() !== val) {
      return `"${val.replace(/"/g, '\\"')}"`;
    }
    return val;
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    let res = '';
    for (const item of val) {
      if (item === null || typeof item !== 'object') {
        res += `\n${indent}- ${jsonToYaml(item, depth + 1)}`;
      } else {
        const itemYaml = jsonToYaml(item, depth + 1).trim();
        const lines = itemYaml.split('\n');
        res += `\n${indent}- ${lines[0]}`;
        if (lines.length > 1) {
          res += '\n' + lines.slice(1).join('\n');
        }
      }
    }
    return res.trim();
  }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    let res = '';
    for (const key of keys) {
      const item = obj[key];
      const formattedKey = /^[a-zA-Z0-9_-]+$/.test(key) ? key : `"${key.replace(/"/g, '\\"')}"`;
      if (item === null || typeof item !== 'object') {
        res += `\n${indent}${formattedKey}: ${jsonToYaml(item, depth + 1)}`;
      } else {
        res += `\n${indent}${formattedKey}:`;
        const itemYaml = jsonToYaml(item, depth + 1);
        res += `\n${itemYaml}`;
      }
    }
    return res.trim();
  }
  return '';
}

/**
 * Formats javascript objects into custom root tag XML.
 */
export function jsonToXml(val: unknown, rootName: string = 'root', depth: number = 0): string {
  const indent = '  '.repeat(depth);
  const escapeXml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  if (val === null) return `${indent}<${rootName} />`;
  if (val === undefined) return '';

  if (typeof val === 'string') {
    return `${indent}<${rootName}>${escapeXml(val)}</${rootName}>`;
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    return `${indent}<${rootName}>${val}</${rootName}>`;
  }

  if (Array.isArray(val)) {
    let res = '';
    for (const item of val) {
      const itemName = rootName.endsWith('s') && rootName.length > 1 ? rootName.slice(0, -1) : 'item';
      res += jsonToXml(item, itemName, depth) + '\n';
    }
    return res.trim();
  }

  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return `${indent}<${rootName} />`;
    let res = `${indent}<${rootName}>\n`;
    for (const key of keys) {
      const safeKey = /^[a-zA-Z_][a-zA-Z0-9_.-]*$/.test(key) ? key : 'property';
      const item = obj[key];
      if (Array.isArray(item)) {
        for (const listItem of item) {
          res += jsonToXml(listItem, safeKey, depth + 1) + '\n';
        }
      } else {
        res += jsonToXml(item, safeKey, depth + 1) + '\n';
      }
    }
    res += `${indent}</${rootName}>`;
    return res;
  }

  return '';
}

/**
 * Flattens nested JSON records and formats them as standard CSV output.
 */
export function jsonToCsv(val: unknown): string {
  let list: unknown[] = [];
  if (Array.isArray(val)) {
    list = val;
  } else if (val !== null && typeof val === 'object') {
    const keys = Object.keys(val as Record<string, unknown>);
    let foundArray = false;
    for (const key of keys) {
      const item = (val as Record<string, unknown>)[key];
      if (Array.isArray(item)) {
        list = item;
        foundArray = true;
        break;
      }
    }
    if (!foundArray) {
      list = [val];
    }
  } else {
    return 'Value,';
  }

  if (list.length === 0) return 'Empty dataset';

  const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, string> => {
    const res: Record<string, string> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        Object.assign(res, flattenObject(val as Record<string, unknown>, newPrefix));
      } else {
        res[newPrefix] = val === null ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val);
      }
    }
    return res;
  };

  const flatList = list.map(item => {
    if (item !== null && typeof item === 'object') {
      return flattenObject(item as Record<string, unknown>);
    }
    return { value: String(item) };
  });

  const headersSet = new Set<string>();
  for (const item of flatList) {
    for (const key of Object.keys(item)) {
      headersSet.add(key);
    }
  }
  const headers = Array.from(headersSet);

  const escapeCsvCell = (str: string) => {
    const escaped = str.replace(/"/g, '""');
    if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') || escaped.includes('\r')) {
      return `"${escaped}"`;
    }
    return escaped;
  };

  let csv = headers.map(escapeCsvCell).join(',') + '\n';
  for (const item of flatList) {
    const row = headers.map(h => escapeCsvCell(item[h] || '')).join(',');
    csv += row + '\n';
  }
  return csv.trim();
}

/**
 * Converts nested JSON schema into URL encoded query strings.
 */
export function jsonToQueryParams(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val !== 'object') {
    return 'value=' + encodeURIComponent(String(val));
  }

  const flattenQueryParams = (obj: Record<string, unknown>, prefix = ''): string[] => {
    const parts: string[] = [];
    for (const key of Object.keys(obj)) {
      const item = obj[key];
      const currentKey = prefix ? `${prefix}[${key}]` : key;
      if (item === null || item === undefined) {
        parts.push(`${encodeURIComponent(currentKey)}=`);
      } else if (typeof item === 'object') {
        parts.push(...flattenQueryParams(item as Record<string, unknown>, currentKey));
      } else {
        parts.push(`${encodeURIComponent(currentKey)}=${encodeURIComponent(String(item))}`);
      }
    }
    return parts;
  };

  return flattenQueryParams(val as Record<string, unknown>).join('&');
}
