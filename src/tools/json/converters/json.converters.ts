/**
 * Converters for JSON to other structured formats (YAML, XML, CSV, Query Params)
 */

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
