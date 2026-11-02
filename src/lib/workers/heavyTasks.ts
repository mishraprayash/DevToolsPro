/**
 * Registry of CPU-heavy tool tasks that can run inside `heavyTasks.worker.ts`.
 * The same `runHeavyTask` is used by the worker and as the main-thread fallback,
 * so tool logic lives only in `src/tools/<tool>/utils.ts`.
 */
import { computeDiff, type DiffOptions, type DiffResult } from '@/tools/diff-checker/utils';
import { generateMockData, type MockSchema } from '@/tools/mock-data/utils';
import { generateJsonSchema, type SchemaOptions, type SchemaResult } from '@/tools/json-schema/utils';
import { testRegex, replaceRegex, type RegexMatch } from '@/tools/regex/utils';

export interface RegexTaskResult {
  matches: RegexMatch[];
  isValid: boolean;
  error?: string;
  replaced: string;
}

export interface HeavyTaskMap {
  diff: {
    req: { original: string; modified: string; options: Partial<DiffOptions> };
    res: DiffResult;
  };
  mock: {
    req: { schema: MockSchema[]; count: number; format: 'json' | 'csv' };
    res: ReturnType<typeof generateMockData>;
  };
  schema: {
    req: { json: string; options: Partial<SchemaOptions> };
    res: SchemaResult;
  };
  regex: {
    req: { pattern: string; flags: string; input: string; replacement: string };
    res: RegexTaskResult;
  };
}

export type HeavyTaskName = keyof HeavyTaskMap;
export type HeavyTaskRequest<K extends HeavyTaskName> = HeavyTaskMap[K]['req'];
export type HeavyTaskResult<K extends HeavyTaskName> = HeavyTaskMap[K]['res'];

/** Payload posted to the heavy-task worker. */
export interface HeavyTaskPayload<K extends HeavyTaskName = HeavyTaskName> {
  task: K;
  req: HeavyTaskRequest<K>;
}

/** Match + replace in one pass so a runaway pattern is bounded by one timeout. */
export function runRegexTask(req: HeavyTaskRequest<'regex'>): RegexTaskResult {
  const res = testRegex(req.pattern, req.flags, req.input);
  let replaced = '';
  if (req.pattern.trim() && res.isValid) {
    const rep = replaceRegex(req.input, req.pattern, req.flags, req.replacement);
    replaced = rep.success ? rep.output : '';
  }
  return { matches: res.matches, isValid: res.isValid, error: res.error, replaced };
}

const handlers: { [K in HeavyTaskName]: (req: HeavyTaskRequest<K>) => HeavyTaskResult<K> } = {
  diff: (req) => computeDiff(req.original, req.modified, req.options),
  mock: (req) => generateMockData(req.schema, req.count, req.format),
  schema: (req) => generateJsonSchema(req.json, req.options),
  regex: runRegexTask,
};

export function isHeavyTaskName(name: unknown): name is HeavyTaskName {
  return typeof name === 'string' && Object.prototype.hasOwnProperty.call(handlers, name);
}

export function runHeavyTask<K extends HeavyTaskName>(task: K, req: HeavyTaskRequest<K>): HeavyTaskResult<K> {
  return handlers[task](req);
}
