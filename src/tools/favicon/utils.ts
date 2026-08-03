export type Result<T> = { success: true; data: T } | { success: false; error: string };

export type FaviconShape = 'square' | 'rounded' | 'circle';

export interface FaviconOptions {
  text: string;
  textColor: string;
  backgroundColor: string;
  fontSize: number;
  shape: FaviconShape;
  padding: number;
}

export const DEFAULT_OPTIONS: FaviconOptions = {
  text: 'D',
  textColor: '#ffffff',
  backgroundColor: '#22d3ee',
  fontSize: 30,
  shape: 'rounded',
  padding: 6,
};

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function validateHexColor(value: string): Result<string> {
  const clean = value.trim();
  if (!HEX_COLOR.test(clean)) {
    return { success: false, error: 'Color must be a valid hex value, e.g. #22d3ee.' };
  }
  if (clean.length === 4) {
    const expanded = clean.slice(1).split('').map((c) => c + c).join('');
    return { success: true, data: `#${expanded}` };
  }
  return { success: true, data: clean };
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildFaviconSvg(options: FaviconOptions): Result<string> {
  const text = options.text.trim();
  if (!text) {
    return { success: false, error: 'Enter at least one character for the favicon.' };
  }
  if (text.length > 6) {
    return { success: false, error: 'Keep the text to 6 characters or fewer for a readable favicon.' };
  }

  const bgCheck = validateHexColor(options.backgroundColor);
  const fgCheck = validateHexColor(options.textColor);
  if (!bgCheck.success) return bgCheck;
  if (!fgCheck.success) return fgCheck;

  const bg = bgCheck.data;
  const fg = fgCheck.data;
  const viewBox = 64;
  const inset = Math.min(Math.max(options.padding, 0), 24);
  const x = inset;
  const y = inset;
  const size = viewBox - inset * 2;
  const fontSize = Math.max(10, Math.min(options.fontSize, 48));

  let shapeElement: string;
  switch (options.shape) {
    case 'circle':
      shapeElement = `<circle cx="${viewBox / 2}" cy="${viewBox / 2}" r="${size / 2}" fill="${bg}"/>`;
      break;
    case 'rounded':
      shapeElement = `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="${bg}"/>`;
      break;
    default:
      shapeElement = `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${bg}"/>`;
  }

  const textElement = `<text x="${viewBox / 2}" y="${viewBox / 2}" fill="${fg}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central" font-family="'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">${escapeXml(text)}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBox} ${viewBox}" width="${viewBox}" height="${viewBox}">${shapeElement}${textElement}</svg>`;

  return { success: true, data: svg };
}

export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export interface FaviconOutput {
  svg: string;
  dataUri: string;
  linkTag: string;
}

export function buildFavicon(options: FaviconOptions): Result<FaviconOutput> {
  const svgRes = buildFaviconSvg(options);
  if (!svgRes.success) return svgRes;

  const svg = svgRes.data;
  const dataUri = svgToDataUri(svg);
  const linkTag = `<link rel="icon" type="image/svg+xml" href="${dataUri}" />`;

  return { success: true, data: { svg, dataUri, linkTag } };
}
