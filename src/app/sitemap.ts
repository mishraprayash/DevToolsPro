import { MetadataRoute } from 'next';
import { tools } from '@/tools/registry';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://devtools-pro.vercel.app';
  const currentDate = new Date().toISOString();

  const toolEntries: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${baseUrl}/tools/${tool.id}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...toolEntries,
  ];
}
