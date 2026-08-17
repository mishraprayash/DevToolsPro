import type { JsonRepairResult } from '../types';

/**
 * Intelligent helper to repair common syntactic errors in invalid JSON payloads.
 */
export function repairJsonString(raw: string): JsonRepairResult {
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
          const content = wordBuffer;
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
  } catch {
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
    } catch {
      const wrapped = '{' + output + '}';
      try {
        JSON.parse(wrapped);
        output = wrapped;
        changes.push("Wrapped object in enclosing curly braces");
      } catch {
        // use parsed output as-is, let primary parser fail
      }
    }
  }

  return { repaired: output, changes };
}
