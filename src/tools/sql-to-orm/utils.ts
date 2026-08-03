export interface GeneratedEntity {
  prisma: string;
  typeorm: string;
  mongoose: string;
}

interface ColumnDef {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  defaultValue?: string;
}

export function parseSqlCreate(sql: string): { success: true; data: ColumnDef[]; tableName: string } | { success: false; error: string } {
  try {
    const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (!cleanSql) {
      return { success: false, error: 'Empty SQL input' };
    }

    // Match CREATE TABLE
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:['"`\w]+(?:\.))?['"`](\w+)['"`]\s*\(([\s\S]+)\)/i;
    const createTableRegexNoQuote = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[\w]+(?:\.))?(\w+)\s*\(([\s\S]+)\)/i;
    
    let match = cleanSql.match(createTableRegex);
    if (!match) {
      match = cleanSql.match(createTableRegexNoQuote);
    }

    if (!match) {
      return { success: false, error: 'Could not parse CREATE TABLE statement. Ensure it starts with CREATE TABLE <name> (...)' };
    }

    const tableName = match[1];
    const columnsStr = match[2];

    // Simple splitting by commas, taking care of parentheses
    const lines: string[] = [];
    let currentLine = '';
    let parenCount = 0;
    for (let i = 0; i < columnsStr.length; i++) {
      const char = columnsStr[i];
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (char === ',' && parenCount === 0) {
        lines.push(currentLine.trim());
        currentLine = '';
      } else {
        currentLine += char;
      }
    }
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    const columns: ColumnDef[] = [];
    const constraints: string[] = [];

    for (const line of lines) {
      // Check for table level constraints
      if (/^(?:CONSTRAINT|PRIMARY\s+KEY|UNIQUE|FOREIGN\s+KEY|KEY|INDEX)\b/i.test(line)) {
        constraints.push(line);
        continue;
      }

      // Parse column line
      // Format: columnName columnType [nullable/key/default/unique/etc]
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;

      const name = parts[0].replace(/['"`]/g, '');
      const typeRaw = parts[1].toUpperCase();

      const rest = parts.slice(2).join(' ').toUpperCase();

      const isPrimaryKey = rest.includes('PRIMARY KEY') || rest.includes('PRIMARY_KEY');
      const isNullable = !rest.includes('NOT NULL');
      const isUnique = rest.includes('UNIQUE');
      
      let defaultValue: string | undefined;
      const defaultMatch = rest.match(/DEFAULT\s+([^)\s,]+)/);
      if (defaultMatch) {
        defaultValue = defaultMatch[1].replace(/['"`]/g, '');
      }

      columns.push({
        name,
        type: typeRaw,
        isNullable,
        isPrimaryKey,
        isUnique,
        defaultValue
      });
    }

    // Process primary key constraints if defined at the bottom
    for (const constraint of constraints) {
      if (/PRIMARY\s+KEY\s*\(([^)]+)\)/i.test(constraint)) {
        const pkMatch = constraint.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
          const pkCols = pkMatch[1].split(',').map(c => c.replace(/['"`\s]/g, ''));
          for (const col of columns) {
            if (pkCols.includes(col.name)) {
              col.isPrimaryKey = true;
            }
          }
        }
      }
    }

    return { success: true, data: columns, tableName };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Parsing error' };
  }
}

export function generateOrmEntities(tableName: string, columns: ColumnDef[]): GeneratedEntity {
  const modelName = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/_(\w)/g, (_, c) => c.toUpperCase());
  
  // 1. Prisma
  let prisma = `model ${modelName} {\n`;
  columns.forEach(col => {
    let type = 'String';
    const typeUpper = col.type.toUpperCase();
    if (typeUpper.includes('INT') || typeUpper.includes('SERIAL')) type = 'Int';
    else if (typeUpper.includes('BIGINT')) type = 'BigInt';
    else if (typeUpper.includes('BOOL')) type = 'Boolean';
    else if (typeUpper.includes('FLOAT') || typeUpper.includes('DOUBLE') || typeUpper.includes('DECIMAL') || typeUpper.includes('NUMERIC')) type = 'Float';
    else if (typeUpper.includes('DATE') || typeUpper.includes('TIME')) type = 'DateTime';

    const nullable = col.isNullable && !col.isPrimaryKey ? '?' : '';
    let attrs = '';
    if (col.isPrimaryKey) attrs += ' @id';
    if (col.isPrimaryKey && (typeUpper.includes('SERIAL') || col.defaultValue?.toLowerCase().includes('nextval'))) {
      attrs += ' @default(autoincrement())';
    } else if (col.defaultValue) {
      if (type === 'Boolean') {
        attrs += ` @default(${col.defaultValue.toLowerCase() === 'true' || col.defaultValue === '1' ? 'true' : 'false'})`;
      } else if (type === 'Int' || type === 'Float') {
        attrs += ` @default(${col.defaultValue})`;
      } else if (type === 'DateTime' && (col.defaultValue.includes('NOW') || col.defaultValue.includes('CURRENT'))) {
        attrs += ` @default(now())`;
      } else {
        attrs += ` @default("${col.defaultValue}")`;
      }
    }
    if (col.isUnique && !col.isPrimaryKey) attrs += ' @unique';

    prisma += `  ${col.name} ${type}${nullable}${attrs}\n`;
  });
  prisma += `}`;

  // 2. TypeORM
  let typeorm = `import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';\n\n`;
  typeorm += `@Entity('${tableName}')\n`;
  typeorm += `export class ${modelName} {\n`;
  columns.forEach(col => {
    let decorators = '';
    let tsType = 'string';
    const typeUpper = col.type.toUpperCase();

    if (col.isPrimaryKey) {
      if (typeUpper.includes('SERIAL') || typeUpper.includes('INT')) {
        decorators += `  @PrimaryGeneratedColumn()\n`;
        tsType = 'number';
      } else {
        decorators += `  @PrimaryGeneratedColumn('uuid')\n`;
        tsType = 'string';
      }
    } else {
      let ormType = 'varchar';
      if (typeUpper.includes('INT') || typeUpper.includes('SERIAL')) {
        ormType = 'int';
        tsType = 'number';
      } else if (typeUpper.includes('BOOL')) {
        ormType = 'boolean';
        tsType = 'boolean';
      } else if (typeUpper.includes('TEXT')) {
        ormType = 'text';
        tsType = 'string';
      } else if (typeUpper.includes('DATE') || typeUpper.includes('TIME')) {
        ormType = 'timestamp';
        tsType = 'Date';
      } else if (typeUpper.includes('FLOAT') || typeUpper.includes('DOUBLE') || typeUpper.includes('DECIMAL') || typeUpper.includes('NUMERIC')) {
        ormType = 'decimal';
        tsType = 'number';
      }

      const options: string[] = [`type: '${ormType}'`];
      if (col.isNullable) options.push('nullable: true');
      if (col.isUnique) options.push('unique: true');
      if (col.defaultValue) {
        if (tsType === 'boolean') {
          options.push(`default: ${col.defaultValue.toLowerCase() === 'true' || col.defaultValue === '1'}`);
        } else if (tsType === 'number') {
          options.push(`default: ${col.defaultValue}`);
        } else {
          options.push(`default: '${col.defaultValue}'`);
        }
      }

      decorators += `  @Column({ ${options.join(', ')} })\n`;
    }

    const optional = col.isNullable ? '?' : '';
    typeorm += `${decorators}  ${col.name}${optional}: ${tsType};\n\n`;
  });
  typeorm += `}`;

  // 3. Mongoose
  let mongoose = `import { Schema, model } from 'mongoose';\n\n`;
  mongoose += `const ${modelName}Schema = new Schema({\n`;
  columns.forEach(col => {
    let type = 'String';
    const typeUpper = col.type.toUpperCase();
    if (typeUpper.includes('INT') || typeUpper.includes('SERIAL') || typeUpper.includes('FLOAT') || typeUpper.includes('DOUBLE') || typeUpper.includes('DECIMAL') || typeUpper.includes('NUMERIC')) {
      type = 'Number';
    } else if (typeUpper.includes('BOOL')) {
      type = 'Boolean';
    } else if (typeUpper.includes('DATE') || typeUpper.includes('TIME')) {
      type = 'Date';
    }

    const options: string[] = [`type: ${type}`];
    if (col.isPrimaryKey || !col.isNullable) options.push('required: true');
    if (col.isUnique) options.push('unique: true');
    if (col.defaultValue) {
      if (type === 'Boolean') {
        options.push(`default: ${col.defaultValue.toLowerCase() === 'true' || col.defaultValue === '1'}`);
      } else if (type === 'Number') {
        options.push(`default: ${col.defaultValue}`);
      } else if (type === 'Date' && (col.defaultValue.includes('NOW') || col.defaultValue.includes('CURRENT'))) {
        options.push(`default: Date.now`);
      } else {
        options.push(`default: '${col.defaultValue}'`);
      }
    }

    mongoose += `  ${col.name}: { ${options.join(', ')} },\n`;
  });
  mongoose += `});\n\n`;
  mongoose += `export const ${modelName} = model('${modelName}', ${modelName}Schema);`;

  return { prisma, typeorm, mongoose };
}
