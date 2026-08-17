import type { SqlDialect } from '../types/schema.types';

export const DIALECT_DATATYPES: Record<SqlDialect, { category: string; types: string[] }[]> = {
  postgresql: [
    { category: 'Numeric', types: ['SERIAL', 'BIGSERIAL', 'SMALLINT', 'INTEGER', 'BIGINT', 'DECIMAL(10,2)', 'NUMERIC', 'REAL', 'DOUBLE PRECISION'] },
    { category: 'String / Text', types: ['VARCHAR(255)', 'CHAR(1)', 'TEXT', 'CITEXT', 'UUID'] },
    { category: 'Date / Time', types: ['TIMESTAMP', 'TIMESTAMPTZ', 'DATE', 'TIME', 'TIMETZ', 'INTERVAL'] },
    { category: 'Boolean', types: ['BOOLEAN'] },
    { category: 'JSON / Objects', types: ['JSONB', 'JSON'] },
    { category: 'Binary & Network', types: ['BYTEA', 'INET', 'CIDR', 'MACADDR'] },
  ],
  mysql: [
    { category: 'Numeric', types: ['INT', 'BIGINT', 'MEDIUMINT', 'SMALLINT', 'TINYINT', 'DECIMAL(10,2)', 'FLOAT', 'DOUBLE'] },
    { category: 'String / Text', types: ['VARCHAR(255)', 'CHAR(1)', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT', "ENUM('active','inactive')"] },
    { category: 'Date / Time', types: ['DATETIME', 'TIMESTAMP', 'DATE', 'TIME', 'YEAR'] },
    { category: 'Boolean', types: ['BOOLEAN', 'TINYINT(1)'] },
    { category: 'JSON & Binary', types: ['JSON', 'BLOB', 'LONGBLOB', 'VARBINARY(255)'] },
  ],
  sqlite: [
    { category: 'Core Storage Classes', types: ['INTEGER', 'TEXT', 'REAL', 'BLOB', 'NUMERIC'] },
    { category: 'Common Affinities', types: ['VARCHAR(255)', 'BOOLEAN', 'DATETIME', 'DOUBLE', 'DECIMAL(10,2)'] },
  ],
};
