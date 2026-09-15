export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface QueryParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ParsedUrlData {
  href: string;
  protocol: string;
  username: string;
  password: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
  queryParams: QueryParam[];
}

function looksLikeDomain(input: string): boolean {
  if (input.startsWith('//')) {
    return true;
  }
  if (input.startsWith('/') || input.startsWith('.')) {
    return false;
  }

  const hostWithAuthAndPort = input.split(/[/?#]/)[0];
  if (!hostWithAuthAndPort) {
    return false;
  }

  const hostWithPort = hostWithAuthAndPort.includes('@')
    ? hostWithAuthAndPort.split('@').pop()!
    : hostWithAuthAndPort;

  if (hostWithPort.startsWith('[')) {
    const closingBracketIndex = hostWithPort.indexOf(']');
    if (closingBracketIndex > 1) {
      return true;
    }
  }

  const hostname = hostWithPort.split(':')[0].toLowerCase();
  if (!hostname) {
    return false;
  }

  if (hostname === 'localhost') {
    return true;
  }

  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    return true;
  }

  const domainRegex = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
  return domainRegex.test(hostname);
}

export function parseUrlString(rawUrl: string): Result<ParsedUrlData> {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { success: false, error: 'URL input cannot be empty.' };
  }

  let formatted = trimmed;
  // If no protocol is provided, prefix https:// for parsing purposes if it looks like a domain
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(formatted)) {
    if (formatted.startsWith('//')) {
      formatted = `https:${formatted}`;
    } else if (looksLikeDomain(formatted)) {
      formatted = `https://${formatted}`;
    }
  }

  try {
    const parsed = new URL(formatted);
    const queryParams: QueryParam[] = [];

    let paramIndex = 0;
    parsed.searchParams.forEach((value, key) => {
      queryParams.push({
        id: `param-${++paramIndex}-${key}`,
        key,
        value,
        enabled: true,
      });
    });

    return {
      success: true,
      data: {
        href: parsed.href,
        protocol: parsed.protocol,
        username: parsed.username,
        password: parsed.password,
        host: parsed.host,
        hostname: parsed.hostname,
        port: parsed.port,
        pathname: parsed.pathname,
        search: parsed.search,
        hash: parsed.hash,
        origin: parsed.origin,
        queryParams,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid URL format';
    return { success: false, error: msg };
  }
}

export function constructUrl(
  protocol: string,
  host: string,
  pathname: string,
  queryParams: QueryParam[],
  hash: string,
  auth?: { username?: string; password?: string }
): Result<string> {
  try {
    const cleanProtocol = protocol.endsWith(':') ? protocol : `${protocol}:`;
    let originPart = `${cleanProtocol}//`;

    if (auth?.username) {
      originPart += encodeURIComponent(auth.username);
      if (auth.password) {
        originPart += `:${encodeURIComponent(auth.password)}`;
      }
      originPart += '@';
    }

    originPart += host.replace(/^[a-zA-Z]+:\/\//, '');

    const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    const url = new URL(cleanPath, originPart);

    // Rebuild search parameters from enabled params
    const sp = new URLSearchParams();
    queryParams.forEach((p) => {
      if (p.enabled && p.key.trim()) {
        sp.append(p.key.trim(), p.value);
      }
    });

    url.search = sp.toString() ? `?${sp.toString()}` : '';
    if (hash) {
      url.hash = hash.startsWith('#') ? hash : `#${hash}`;
    }

    return { success: true, data: url.toString() };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not reconstruct URL';
    return { success: false, error: msg };
  }
}

export function encodeUrlComponentSafe(val: string): Result<string> {
  try {
    return { success: true, data: encodeURIComponent(val) };
  } catch {
    return { success: false, error: 'Failed to encode value' };
  }
}

export function decodeUrlComponentSafe(val: string): Result<string> {
  try {
    return { success: true, data: decodeURIComponent(val) };
  } catch {
    return { success: false, error: 'Failed to decode value' };
  }
}
