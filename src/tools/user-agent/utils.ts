export interface ParsedUserAgent {
  browser: { name: string; version: string };
  os: { name: string; version: string };
  device: { type: 'Mobile' | 'Tablet' | 'Desktop'; brand: string };
  engine: { name: string; version: string };
}

export function parseUserAgent(uaStr: string): ParsedUserAgent {
  const ua = uaStr.trim();
  
  // 1. Browser Detection
  let browserName = 'Unknown Browser';
  let browserVer = 'Unknown';

  if (/chrome|crios/i.test(ua) && !/edge|edg|opr|opera|vivaldi/i.test(ua)) {
    browserName = 'Google Chrome';
    const match = ua.match(/(?:chrome|crios)\/([\d.]+)/i);
    if (match) browserVer = match[1];
  } else if (/safari/i.test(ua) && !/chrome|crios|android|edge|edg/i.test(ua)) {
    browserName = 'Apple Safari';
    const match = ua.match(/version\/([\d.]+)/i);
    if (match) browserVer = match[1];
  } else if (/firefox|fxios/i.test(ua)) {
    browserName = 'Mozilla Firefox';
    const match = ua.match(/(?:firefox|fxios)\/([\d.]+)/i);
    if (match) browserVer = match[1];
  } else if (/edge|edg/i.test(ua)) {
    browserName = 'Microsoft Edge';
    const match = ua.match(/(?:edge|edg|edga|edgios)\/([\d.]+)/i);
    if (match) browserVer = match[1];
  } else if (/opera|opr/i.test(ua)) {
    browserName = 'Opera';
    const match = ua.match(/(?:opera|opr)\/([\d.]+)/i);
    if (match) browserVer = match[1];
  } else if (/vivaldi/i.test(ua)) {
    browserName = 'Vivaldi';
    const match = ua.match(/vivaldi\/([\d.]+)/i);
    if (match) browserVer = match[1];
  } else if (/iemobile|msie|trident/i.test(ua)) {
    browserName = 'Internet Explorer';
    const match = ua.match(/(?:msie\s|rv:)([\d.]+)/i);
    if (match) browserVer = match[1];
  }

  // 2. OS Detection
  let osName = 'Unknown OS';
  let osVer = 'Unknown';

  if (/windows/i.test(ua)) {
    osName = 'Windows';
    const match = ua.match(/windows\snt\s([\d._]+)/i);
    if (match) {
      const ver = match[1].replace(/_/g, '.');
      if (ver === '10.0') osVer = '10 / 11';
      else if (ver === '6.3') osVer = '8.1';
      else if (ver === '6.2') osVer = '8';
      else if (ver === '6.1') osVer = '7';
      else osVer = ver;
    }
  } else if (/android/i.test(ua)) {
    osName = 'Android';
    const match = ua.match(/android\s([\d.]+)/i);
    if (match) osVer = match[1];
  } else if (/ipad|iphone|ipod/i.test(ua)) {
    osName = 'iOS';
    const match = ua.match(/os\s([\d._]+)/i);
    if (match) osVer = match[1].replace(/_/g, '.');
  } else if (/macintosh|mac\sos/i.test(ua)) {
    osName = 'macOS';
    const match = ua.match(/mac\sos\sx\s([\d._]+)/i);
    if (match) osVer = match[1].replace(/_/g, '.');
  } else if (/linux/i.test(ua)) {
    osName = 'Linux';
  }

  // 3. Device Type Detection
  let deviceType: 'Mobile' | 'Tablet' | 'Desktop' = 'Desktop';
  let brand = 'Generic Desktop';

  if (/ipad/i.test(ua)) {
    deviceType = 'Tablet';
    brand = 'Apple iPad';
  } else if (/iphone/i.test(ua)) {
    deviceType = 'Mobile';
    brand = 'Apple iPhone';
  } else if (/android/i.test(ua)) {
    brand = 'Android Device';
    if (/mobile/i.test(ua)) {
      deviceType = 'Mobile';
    } else {
      deviceType = 'Tablet';
    }
    const modelMatch = ua.match(/android\s[^;]+;\s([^;)]+)/i);
    if (modelMatch) brand = modelMatch[1].trim();
  } else if (/windows\sphone/i.test(ua)) {
    deviceType = 'Mobile';
    brand = 'Windows Phone';
  }

  // 4. Rendering Engine Detection
  let engineName = 'Unknown Engine';
  let engineVer = 'Unknown';

  if (/webkit/i.test(ua)) {
    engineName = 'WebKit';
    const match = ua.match(/applewebkit\/([\d.]+)/i);
    if (match) engineVer = match[1];
  } else if (/gecko/i.test(ua) && !/webkit/i.test(ua)) {
    engineName = 'Gecko';
    const match = ua.match(/rv:([\d.]+)/i);
    if (match) engineVer = match[1];
  } else if (/trident/i.test(ua)) {
    engineName = 'Trident';
    const match = ua.match(/trident\/([\d.]+)/i);
    if (match) engineVer = match[1];
  }

  return {
    browser: { name: browserName, version: browserVer },
    os: { name: osName, version: osVer },
    device: { type: deviceType, brand },
    engine: { name: engineName, version: engineVer }
  };
}
