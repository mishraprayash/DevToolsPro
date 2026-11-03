'use client';

import * as React from 'react';
import { Code } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { gqlToTs } from '@/tools/graphql-to-ts/utils';
import { useToolShortcuts, useShortcutHint } from '@/lib/hooks/useToolShortcuts';
import { copyText } from '@/lib/utils/copyText';
import { OutputActions, downloadOutput } from '@/components/tool/OutputActions';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { useTextFileDrop } from '@/lib/hooks/useTextFileDrop';
import { TextFileDropOverlay } from '@/components/ui/TextFileDropOverlay';

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

const examples = [
  { label: 'Blog schema', hint: 'types • enum • input', value: DEFAULT_GQL },
  {
    label: 'E-commerce',
    hint: 'nested lists',
    value: `enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  CANCELLED
}

type Product {
  id: ID!
  name: String!
  priceCents: Int!
  tags: [String!]
}

type OrderLine {
  product: Product!
  quantity: Int!
}

type Order {
  id: ID!
  status: OrderStatus!
  lines: [OrderLine!]!
  total: Float
}
`,
  },
  {
    label: 'Interface',
    hint: 'interface • input',
    value: `interface Node {
  id: ID!
}

type Comment {
  id: ID!
  body: String!
  createdAt: String!
  edited: Boolean
}

input UpdateCommentInput {
  id: ID!
  body: String
}
`,
  },
];

export default function Page() {
  const [input, setInput] = React.useState(DEFAULT_GQL);
  const [activeExample, setActiveExample] = React.useState(0);
  const { isDragging, dropProps } = useTextFileDrop((text) => { setInput(text); setActiveExample(-1); });
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

  const hint = useShortcutHint();
  const clearInput = () => { setInput(''); setActiveExample(-1); };
  useToolShortcuts({
    onCopy: () => void copyText(error ? '' : output),
    onDownload: () => downloadOutput(error ? '' : output, 'graphql-types.ts'),
    onClear: clearInput,
  });

  return (
    <ToolLayout
      name="GraphQL to TypeScript"
      description="Paste a GraphQL schema or query, and instantly generate strict TypeScript interfaces and enums."
      category="Formatting"
    >
      <ExamplePills
        examples={examples}
        activeIndex={activeExample}
        onSelect={(i) => { setActiveExample(i); setInput(examples[i].value); }}
      />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        
        {/* Left Input */}
        <div className="flex flex-col space-y-3 h-[600px]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Code className="h-4 w-4 text-pink-500" /> GraphQL Schema
            </h2>
            <Button variant="ghost" size="sm" onClick={clearInput} title={hint('Clear', 'clear')} className="h-8">Clear</Button>
          </div>
          <div className="flex-1 relative rounded-xl border border-border bg-bg-secondary overflow-hidden focus-within:border-pink-500 transition-colors" {...dropProps}>
            <textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); setActiveExample(-1); }}
              placeholder="Paste your GraphQL type definitions here or drop a .graphql file..."
              className="absolute inset-0 w-full h-full p-4 bg-transparent text-text-primary font-mono text-sm focus:outline-none resize-none custom-scrollbar"
              spellCheck={false}
            />
            <TextFileDropOverlay show={isDragging} />
          </div>
        </div>

        {/* Right Output */}
        <div className="flex flex-col space-y-3 h-[600px]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Code className="h-4 w-4 text-blue-500" /> TypeScript Output
            </h2>
            <OutputActions value={error ? '' : output} filename="graphql-types.ts" />
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
