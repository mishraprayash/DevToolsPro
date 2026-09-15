
export type SqlDialect = 
  | 'sql' 
  | 'postgresql' 
  | 'mysql' 
  | 'mariadb' 
  | 'sqlite' 
  | 'transactsql' 
  | 'plsql' 
  | 'bigquery' 
  | 'snowflake' 
  | 'redshift';

export type SqlKeywordCase = 'upper' | 'lower' | 'preserve';

export interface SqlFormatterOptions {
  language: SqlDialect;
  keywordCase: SqlKeywordCase;
  tabWidth: number;
  useSpaces: boolean;
}

export interface SqlQueryStats {
  characterCount: number;
  wordCount: number;
  lineCount: number;
  commandType: string;
  tablesDetected: string[];
}

export async function formatSql(query: string, options: SqlFormatterOptions): Promise<{ success: true; data: string } | { success: false; error: string }> {
  try {
    if (!query.trim()) {
      return { success: true, data: '' };
    }

    const { format } = await import('sql-formatter');
    const formatted = format(query, {
      language: options.language,
      keywordCase: options.keywordCase,
      tabWidth: options.tabWidth,
      useTabs: !options.useSpaces,
    });

    return { success: true, data: formatted };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to format SQL query' };
  }
}

export function minifySql(query: string): { success: true; data: string } | { success: false; error: string } {
  try {
    if (!query.trim()) {
      return { success: true, data: '' };
    }
    let cleaned = query.replace(/--.*$/gm, '');
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return { success: true, data: cleaned };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to minify SQL' };
  }
}

export function analyzeSql(query: string): SqlQueryStats {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      characterCount: 0,
      wordCount: 0,
      lineCount: 0,
      commandType: 'N/A',
      tablesDetected: [],
    };
  }

  const lines = trimmed.split('\n').length;
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  
  const firstWordMatch = trimmed.match(/^[a-zA-Z]+/);
  const commandType = firstWordMatch ? firstWordMatch[0].toUpperCase() : 'UNKNOWN';

  const tableRegex = /(?:FROM|JOIN|INTO|UPDATE)\s+([`"[\]\w]+)/gi;
  const tables = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(trimmed)) !== null) {
    if (match[1]) {
      const cleanTable = match[1].replace(/[`"[\]]/g, '');
      if (!['SELECT', 'WHERE', 'ORDER', 'GROUP', 'HAVING', 'LIMIT', 'JOIN', 'ON', 'VALUES', 'SET'].includes(cleanTable.toUpperCase())) {
        tables.add(cleanTable);
      }
    }
  }

  return {
    characterCount: trimmed.length,
    wordCount: words,
    lineCount: lines,
    commandType,
    tablesDetected: Array.from(tables),
  };
}
