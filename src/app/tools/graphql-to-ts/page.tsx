'use client';

import * as React from 'react';
import { ArrowRight, Code } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { gqlToTs } from '@/tools/graphql-to-ts/utils';

const DEFAULT_GQL = `type User {
  id: ID!
  username: String!
  email: String
  age: Int
  isActive: Boolean!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
}

enum Role {
  ADMIN
  USER
  GUEST
}

input CreateUserInput {
  username: String!
  email: String
  role: Role!
}
`;

export default function Page() {
  const [input, setInput] = React.useState(DEFAULT_GQL);
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const res = gqlToTs(input);
    if (res.success) {
      setOutput(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [input]);

  return (
    <ToolLayout
      name="GraphQL to TypeScript"
      description="Paste a GraphQL schema or query, and instantly generate strict TypeScript interfaces and enums."
      category="Formatting"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        
        {/* Left Input */}
        <div className="flex flex-col space-y-3 h-[600px]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Code className="h-4 w-4 text-pink-500" /> GraphQL Schema
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setInput('')} className="h-8">Clear</Button>
          </div>
          <div className="flex-1 relative rounded-xl border border-border bg-bg-secondary overflow-hidden focus-within:border-pink-500 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your GraphQL type definitions here..."
              className="absolute inset-0 w-full h-full p-4 bg-transparent text-text-primary font-mono text-sm focus:outline-none resize-none custom-scrollbar"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right Output */}
        <div className="flex flex-col space-y-3 h-[600px]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Code className="h-4 w-4 text-blue-500" /> TypeScript Output
            </h2>
            <CopyButton value={output} />
          </div>
          <div className="flex-1 relative rounded-xl border border-border bg-bg-secondary overflow-hidden">
            {error ? (
              <div className="p-4 text-sm text-red-400 font-mono">{error}</div>
            ) : (
              <textarea
                readOnly
                value={output}
                className="absolute inset-0 w-full h-full p-4 bg-transparent text-text-primary font-mono text-sm focus:outline-none resize-none custom-scrollbar"
              />
            )}
          </div>
        </div>

      </div>
    </ToolLayout>
  );
}
