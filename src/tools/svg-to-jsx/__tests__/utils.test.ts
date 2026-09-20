import { describe, it, expect } from 'vitest';
import { svgToJsx } from '../utils';

describe('SVG to JSX Utilities', () => {
  it('should convert valid SVG to React JSX component', () => {
    const svg = '<svg width="24" height="24" class="icon"><path d="M0 0h24v24H0z"/></svg>';
    const res = svgToJsx(svg, { componentName: 'Icon', typescript: true, forwardRef: false });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.code).toContain('function Icon(');
      expect(res.code).toContain('className="icon"');
      expect(res.code).toContain('React.ComponentPropsWithoutRef');
    }
  });

  it('should handle inline style conversion to JSX objects', () => {
    const svg = '<svg style="background-color: red; margin-top: 10px"><circle cx="12" cy="12" r="10"/></svg>';
    const res = svgToJsx(svg, { componentName: 'StyledSvg' });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.code).toContain('style={{ backgroundColor: "red", marginTop: "10px" }}');
    }
  });

  it('should return error for invalid SVG input', () => {
    const res = svgToJsx('<div>Not an SVG</div>');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('Could not find <svg>');
    }
  });
});
