export type MockFieldType = 'id' | 'uuid' | 'name' | 'email' | 'age' | 'boolean' | 'date' | 'status';

export interface MockSchema {
  name: string;
  type: MockFieldType;
}

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const domains = ['example.com', 'test.net', 'demo.org', 'mail.com', 'fake.io'];
const statuses = ['active', 'inactive', 'pending', 'suspended', 'archived'];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx

    let uuid = '';
    for (let i = 0; i < 16; i++) {
      if (i === 4 || i === 6 || i === 8 || i === 10) {
        uuid += '-';
      }
      uuid += bytes[i].toString(16).padStart(2, '0');
    }
    return uuid;
  }

  throw new Error('Cryptographically secure random number generator unavailable');
}

function generateValue(type: MockFieldType, index: number): unknown {
  switch (type) {
    case 'id':
      return index + 1;
    case 'uuid':
      return generateUUID();
    case 'name':
      return `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
    case 'email':
      return `${getRandomItem(firstNames).toLowerCase()}.${getRandomItem(lastNames).toLowerCase()}@${getRandomItem(domains)}`;
    case 'age':
      return getRandomInt(18, 80);
    case 'boolean':
      return Math.random() > 0.5;
    case 'date':
      const start = new Date(2020, 0, 1).getTime();
      const end = new Date().getTime();
      return new Date(start + Math.random() * (end - start)).toISOString();
    case 'status':
      return getRandomItem(statuses);
    default:
      return null;
  }
}

export function generateMockData(schema: MockSchema[], count: number = 10, format: 'json' | 'csv' = 'json'): { success: true; data: string } | { success: false; error: string } {
  if (count < 1 || count > 1000) return { success: false, error: 'Count must be between 1 and 1000' };
  if (schema.length === 0) return { success: false, error: 'Schema must contain at least one field' };
  try {

    const rows = [];
    for (let i = 0; i < count; i++) {
      const row: Record<string, unknown> = {};
      for (const field of schema) {
        row[field.name] = generateValue(field.type, i);
      }
      rows.push(row);
    }

    if (format === 'json') {
      return { success: true, data: JSON.stringify(rows, null, 2) };
    } else {
      const headers = schema.map(f => f.name).join(',');
      const csvRows = rows.map(row => 
        schema.map(f => {
          const val = row[f.name];
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      );
      return { success: true, data: [headers, ...csvRows].join('\n') };
    }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate mock data' };
  }
}
