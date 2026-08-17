'use server';

export type TargetLanguage = 
  | 'javascript-fetch'
  | 'javascript-axios'
  | 'javascript-xhr'
  | 'python'
  | 'python-httpx'
  | 'go'
  | 'rust'
  | 'php'
  | 'java'
  | 'csharp'
  | 'ruby';

export interface CurlConverterResult {
  success: boolean;
  code?: string;
  error?: string;
}

export interface CurlDetails {
  url: string;
  method: string;
  headers: Record<string, string>;
  hasBody: boolean;
}

export async function convertCurl(curlCommand: string, target: TargetLanguage): Promise<CurlConverterResult> {
  if (!curlCommand || !curlCommand.trim().startsWith('curl')) {
    return { success: false, error: 'Input must be a valid cURL command starting with "curl"' };
  }

  try {
    const converter = await import('curlconverter');
    
    let code = '';
    switch (target) {
      case 'javascript-fetch':
        code = converter.toJavaScript(curlCommand);
        break;
      case 'javascript-axios':
        code = converter.toNodeAxios(curlCommand);
        break;
      case 'javascript-xhr':
        code = converter.toBrowser(curlCommand);
        break;
      case 'python':
        code = converter.toPython(curlCommand);
        break;

      case 'go':
        code = converter.toGo(curlCommand);
        break;
      case 'rust':
        code = converter.toRust(curlCommand);
        break;
      case 'php':
        code = converter.toPhp(curlCommand);
        break;
      case 'java':
        code = converter.toJava(curlCommand);
        break;
      case 'csharp':
        code = converter.toCSharp(curlCommand);
        break;
      case 'ruby':
        code = converter.toRuby(curlCommand);
        break;
      default:
        code = converter.toJavaScript(curlCommand);
    }
    
    return { success: true, code };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to parse cURL command: ${(error as Error).message}` 
    };
  }
}

export async function inspectCurl(curlCommand: string): Promise<CurlDetails> {
  const urlMatch = curlCommand.match(/https?:\/\/[^\s"']+/);
  const url = urlMatch ? urlMatch[0] : '';
  
  let method = 'GET';
  if (/(-X|--request)\s+POST/i.test(curlCommand) || /(-d|--data|--data-raw|--data-binary)\s+/.test(curlCommand)) {
    method = 'POST';
  } else if (/(-X|--request)\s+PUT/i.test(curlCommand)) {
    method = 'PUT';
  } else if (/(-X|--request)\s+DELETE/i.test(curlCommand)) {
    method = 'DELETE';
  } else if (/(-X|--request)\s+PATCH/i.test(curlCommand)) {
    method = 'PATCH';
  } else if (/(-X|--request)\s+HEAD/i.test(curlCommand)) {
    method = 'HEAD';
  }

  const headers: Record<string, string> = {};
  const headerRegex = /(-H|--header)\s+["']?([^"'\n]+)["']?/gi;
  let match: RegExpExecArray | null;
  while ((match = headerRegex.exec(curlCommand)) !== null) {
    const raw = match[2];
    const parts = raw.split(':');
    if (parts.length >= 2) {
      headers[parts[0].trim()] = parts.slice(1).join(':').trim();
    }
  }

  const hasBody = /(-d|--data|--data-raw|--data-binary)\s+/.test(curlCommand);

  return {
    url,
    method,
    headers,
    hasBody,
  };
}
