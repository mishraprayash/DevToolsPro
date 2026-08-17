# Sitemap & Robots.txt Generator

## 1. Overview
The **Sitemap & Robots.txt Generator** empowers web developers to construct valid, SEO-optimized XML sitemaps and search crawler `robots.txt` policy files directly in the browser.

---

## 2. Directory Structure
```
src/tools/sitemap/
├── README.md           # Developer documentation
└── utils.ts            # XML builders, URL normalizers, and robots formatter

src/app/tools/sitemap/
└── page.tsx            # Interactive URL list builder & generator UI
```

---

## 3. Pure Logic & APIs (`utils.ts`)

```typescript
export interface SitemapUrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}
```

### Key Functions
| Function | Parameters | Returns | Description |
|---|---|---|---|
| `generateSitemapXml(entries)` | `SitemapUrlEntry[]` | `Result<string>` | Generates schema-valid XML `<urlset>` output. |
| `generateRobotsTxt(options)` | `RobotsOptions` | `Result<string>` | Generates search crawler rules with user-agent allowances, disallows, and sitemap reference. |
| `parseUrlList(rawText)` | `rawText: string` | `SitemapUrlEntry[]` | Batch extracts URLs from line-separated lists. |

---

## 4. UI Implementation
* **Visual Table & Raw Paste**: Add URLs individually with priority sliders and change frequencies, or paste raw URLs in bulk.
* **Instant XML / TXT Validation**: Verifies URL protocol and formatting before XML generation.
* **1-Click Download**: Download `sitemap.xml` or `robots.txt` files directly.

---

## 5. How to Contribute / Extend
* Add support for Google News sitemaps, Video sitemaps, or `hreflang` alternate language tags.
