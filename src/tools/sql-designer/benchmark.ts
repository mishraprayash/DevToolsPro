import { parseSqlToNodes } from './parsers/sql.parser';

function generateSql(numTables: number, edgesPerTable: number) {
  let sql = '';
  for (let i = 0; i < numTables; i++) {
    sql += `CREATE TABLE table_${i} (\n`;
    sql += `  id INT PRIMARY KEY,\n`;
    sql += `  val VARCHAR(255)\n`;
    if (i > 0) {
      for (let j = 0; j < edgesPerTable; j++) {
        const target = (i - 1 - j + numTables) % i;
        sql += `,  ref_id_${j} INT,\n`;
        sql += `  FOREIGN KEY (ref_id_${j}) REFERENCES table_${target}(id)\n`;
      }
    }
    sql += `);\n\n`;
  }
  return sql;
}

function runBenchmark() {
  const sql = generateSql(500, 10); // 500 tables, ~5000 edges
  const runs = 10;

  // Warmup
  parseSqlToNodes(sql);

  const start = performance.now();
  for (let i = 0; i < runs; i++) {
    parseSqlToNodes(sql);
  }
  const total = performance.now() - start;
  const avg = total / runs;

  console.log(`Benchmark completed (${runs} runs):`);
  console.log(`Total time: ${total.toFixed(2)} ms`);
  console.log(`Average time per run: ${avg.toFixed(2)} ms`);
}

runBenchmark();
