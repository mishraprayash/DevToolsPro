# Favicon & App Icon Generator

## 1. Overview
The **Favicon Generator** allows developers and designers to quickly create modern SVG, PNG, and multi-size web favicons using text initials, emojis, custom background gradients, shapes, and border radii with real-time browser tab mockups.

---

## 2. Directory Structure
```
src/tools/favicon/
├── README.md           # Developer documentation
└── utils.ts            # SVG string builder, HTML meta snippet generator

src/app/tools/favicon/
└── page.tsx            # Live canvas designer, color picker, and preview UI
```

---

## 3. Pure Logic & APIs (`utils.ts`)

```typescript
export interface FaviconConfig {
  type: 'emoji' | 'text';
  value: string;
  fontSize: number;
  textColor: string;
  fontFamily: string;
  bgType: 'solid' | 'gradient' | 'transparent';
  bgColor: string;
  bgGradientStart: string;
  bgGradientEnd: string;
  bgGradientAngle: number;
  borderRadius: number; // 0 to 50 (percentage)
}
```

### Key Functions
| Function | Parameters | Returns | Description |
|---|---|---|---|
| `generateFaviconSvg(config)` | `FaviconConfig` | `string` | Generates SVG markup based on configuration. |
| `generateHtmlMetaTags(options)` | `options` | `string` | Produces standard HTML `<link rel="icon">` tags for web headers. |

---

## 4. UI Implementation
* **Live Browser Tab Preview**: Displays how the icon appears in both light and dark browser tab chrome.
* **Format Exports**: Download as `.svg`, or export complete HTML link snippets.

---

## 5. How to Contribute / Extend
* Add raster canvas rendering for multi-size `.ico` and `apple-touch-icon` package zip exports.
