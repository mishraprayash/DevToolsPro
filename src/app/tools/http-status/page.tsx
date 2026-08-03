'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { httpStatusCodes, searchHttpStatus, type HttpStatus } from '@/tools/http-status/utils';

export default function Page() {
  const [query, setQuery] = React.useState('');
  
  const results = React.useMemo(() => {
    if (!query.trim()) return httpStatusCodes;
    return searchHttpStatus(query);
  }, [query]);

  // Group by category
  const groupedResults = React.useMemo(() => {
    const groups: Record<string, HttpStatus[]> = {};
    for (const status of results) {
      if (!groups[status.category]) {
        groups[status.category] = [];
      }
      groups[status.category].push(status);
    }
    return groups;
  }, [results]);

  return (
    <ToolLayout
      name="HTTP Status Code Glossary"
      description="A quick, searchable reference tool for all HTTP status codes with their exact definitions."
      category="Network"
    >
      <div className="space-y-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by code (e.g., 404), message, or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:border-accent focus:outline-none transition-colors"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
        </div>

        <div className="space-y-8">
          {Object.entries(groupedResults).map(([category, statuses]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-bold text-text-primary border-b border-border pb-2">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statuses.map((status) => (
                  <div 
                    key={status.code} 
                    className="p-4 rounded-xl border border-border bg-bg-secondary hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 rounded bg-bg-tertiary text-accent font-mono font-bold text-sm">
                        {status.code}
                      </span>
                      <h4 className="font-semibold text-text-primary">{status.message}</h4>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {status.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(groupedResults).length === 0 && (
            <div className="text-center py-12 text-text-muted">
              No HTTP status codes found for &quot;{query}&quot;.
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
