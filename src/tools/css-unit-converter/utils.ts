export interface FluidTypographyOptions {
  minSize: number;
  maxSize: number;
  minWidth: number;
  maxWidth: number;
  rootFontSize: number;
  useRem: boolean;
}

export interface FluidTypographyResult {
  clampCode: string;
  tailwindArbitrary: string;
  cssVariable: string;
  formula: string;
}

export interface UnitConversionResult {
  px: string;
  rem: string;
  em: string;
  vw: string;
  vh: string;
  percent: string;
}

export function convertUnits(
  value: number,
  fromUnit: 'px' | 'rem' | 'em' | 'vw' | 'vh' | '%',
  rootFontSize: number = 16,
  viewportWidth: number = 1920,
  viewportHeight: number = 1080
): UnitConversionResult {
  // Convert input value to base pixels first
  let pxValue = 0;
  
  switch (fromUnit) {
    case 'px':
      pxValue = value;
      break;
    case 'rem':
    case 'em':
      pxValue = value * rootFontSize;
      break;
    case 'vw':
      pxValue = (value * viewportWidth) / 100;
      break;
    case 'vh':
      pxValue = (value * viewportHeight) / 100;
      break;
    case '%':
      pxValue = (value * rootFontSize) / 100;
      break;
  }

  // Derive all other units from pixels
  const px = pxValue;
  const rem = pxValue / rootFontSize;
  const em = pxValue / rootFontSize;
  const vw = (pxValue / viewportWidth) * 100;
  const vh = (pxValue / viewportHeight) * 100;
  const percent = (pxValue / rootFontSize) * 100;

  // Helper to strip extra zeros or keep 4 decimals
  const format = (n: number) => {
    if (Number.isInteger(n)) return n.toString();
    return parseFloat(n.toFixed(4)).toString();
  };

  return {
    px: `${format(px)}px`,
    rem: `${format(rem)}rem`,
    em: `${format(em)}em`,
    vw: `${format(vw)}vw`,
    vh: `${format(vh)}vh`,
    percent: `${format(percent)}%`,
  };
}

export function generateFluidClamp(options: FluidTypographyOptions): FluidTypographyResult {
  const { minSize, maxSize, minWidth, maxWidth, rootFontSize, useRem } = options;

  // Fallbacks to avoid division by zero
  const safeMinWidth = minWidth || 320;
  const safeMaxWidth = maxWidth || 1200;
  const widthDiff = safeMaxWidth - safeMinWidth || 1;

  if (useRem) {
    // Convert everything to rems
    const minSizeRem = minSize / rootFontSize;
    const maxSizeRem = maxSize / rootFontSize;
    const minWidthRem = safeMinWidth / rootFontSize;
    const maxWidthRem = safeMaxWidth / rootFontSize;

    // Linear scaling calculations
    const slope = (maxSizeRem - minSizeRem) / (maxWidthRem - minWidthRem);
    const intercept = minSizeRem - slope * minWidthRem;

    const slopeVw = slope * 100;

    const formattedMin = `${parseFloat(minSizeRem.toFixed(4))}rem`;
    const formattedMax = `${parseFloat(maxSizeRem.toFixed(4))}rem`;
    const formattedIntercept = `${parseFloat(intercept.toFixed(4))}rem`;
    const formattedSlopeVw = `${parseFloat(slopeVw.toFixed(4))}vw`;

    // Construct clamp code
    // Preferred calculation: intercept + slopeVw
    const preferredExpr = `${formattedIntercept} + ${formattedSlopeVw}`;
    const clampCode = `clamp(${formattedMin}, ${preferredExpr}, ${formattedMax})`;
    const cssVariable = `--font-size-fluid: ${clampCode};`;
    const tailwindArbitrary = `text-[${clampCode.replace(/\s+/g, '')}]`;
    const formula = `Slope: ${slope.toFixed(6)}, Intercept: ${intercept.toFixed(6)}rem`;

    return {
      clampCode,
      tailwindArbitrary,
      cssVariable,
      formula
    };
  } else {
    // Pure pixels clamp
    const slope = (maxSize - minSize) / widthDiff;
    const intercept = minSize - slope * safeMinWidth;

    const slopeVw = slope * 100;

    const formattedMin = `${parseFloat(minSize.toFixed(2))}px`;
    const formattedMax = `${parseFloat(maxSize.toFixed(2))}px`;
    const formattedIntercept = `${parseFloat(intercept.toFixed(2))}px`;
    const formattedSlopeVw = `${parseFloat(slopeVw.toFixed(4))}vw`;

    const preferredExpr = `${formattedIntercept} + ${formattedSlopeVw}`;
    const clampCode = `clamp(${formattedMin}, ${preferredExpr}, ${formattedMax})`;
    const cssVariable = `--font-size-fluid: ${clampCode};`;
    const tailwindArbitrary = `text-[${clampCode.replace(/\s+/g, '')}]`;
    const formula = `Slope: ${slope.toFixed(6)}, Intercept: ${intercept.toFixed(2)}px`;

    return {
      clampCode,
      tailwindArbitrary,
      cssVariable,
      formula
    };
  }
}

// Calculate responsive font size at an exact current viewport size
export function calculateCurrentSize(
  viewportWidth: number,
  options: FluidTypographyOptions
): number {
  const { minSize, maxSize, minWidth, maxWidth } = options;

  if (viewportWidth <= minWidth) return minSize;
  if (viewportWidth >= maxWidth) return maxSize;

  const slope = (maxSize - minSize) / (maxWidth - minWidth);
  return minSize + slope * (viewportWidth - minWidth);
}
