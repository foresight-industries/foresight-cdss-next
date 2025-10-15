#!/usr/bin/env tsx

/**
 * Simple script to populate modifier codes from a processed SQL file.
 * This script automatically handles data insertion for the modifier_code table.
 */

import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import type { AwsDataApiPgDatabase } from 'drizzle-orm/aws-data-api/pg';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { sql } from 'drizzle-orm';
import { config } from '@dotenvx/dotenvx';

function initializeDatabase() {
  // Re-read environment variables on each execution
  config({ path: './.env.local' });

  const client = new RDSDataClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  if (
    !process.env.DATABASE_NAME ||
    !process.env.DATABASE_SECRET_ARN ||
    !process.env.DATABASE_CLUSTER_ARN
  ) {
    throw new Error('Missing required AWS RDS environment variables');
  }

  return drizzle(client, {
    database: process.env.DATABASE_NAME ?? 'rcm',
    secretArn: process.env.DATABASE_SECRET_ARN,
    resourceArn: process.env.DATABASE_CLUSTER_ARN,
  });
}

async function executeSQLFile(db: AwsDataApiPgDatabase<any>, filePath: string) {
  console.log(`📄 Reading SQL file: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`SQL file not found: ${filePath}`);
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Fix common SQL syntax issues
  content = content.replace(/,(\s*\n\s*);/g, '$1;'); // Remove trailing commas before semicolons with newlines
  content = content.replace(/,\s*;/g, ';'); // Remove trailing commas before semicolons
  content = content.replace(/updated_at = NOW\(\),(\s*\n\s*);/g, 'updated_at = NOW()$1;'); // Specific fix for this pattern

  // Split by INSERT INTO to handle large multi-line statements
  const statements = content
    .split(/INSERT INTO/i)
    .map(stmt => stmt.trim())
    .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '')
    .map(stmt => 'INSERT INTO ' + stmt);

  console.log(`📝 Found ${statements.length} SQL statements to execute`);

  let executed = 0;
  for (const statement of statements) {
    if (statement.toLowerCase().startsWith('insert into')) {
      try {
        // Break large statements into smaller batches due to AWS RDS Data API 65KB limit
        await executeLargeStatement(db, statement, executed + 1, statements.length);
        executed++;
      } catch (error) {
        console.error(`❌ Statement ${executed + 1} failed. Stopping execution.`);
        console.error('Full error details:', error);
        throw error;
      }
    }
  }

  console.log(`✅ Executed ${executed} statements`);
}

async function executeLargeStatement(db: AwsDataApiPgDatabase<any>, statement: string, statementNum: number, totalStatements: number) {
  const MAX_STATEMENT_SIZE = 60000; // Leave some buffer under 65KB limit

  if (statement.length <= MAX_STATEMENT_SIZE) {
    // Statement is small enough, execute directly
    const cleanStatement = statement.trim().endsWith(';') ? statement.trim() : statement.trim() + ';';
    await db.execute(sql.raw(cleanStatement));
    console.log(`✓ Executed statement ${statementNum}/${totalStatements}`);
    return;
  }

  console.log(`📦 Breaking large statement ${statementNum}/${totalStatements} into batches (${statement.length} chars)`);

  // Extract the INSERT INTO table_name (...columns...) VALUES part
  const valuesIndex = statement.toLowerCase().indexOf(' values');
  if (valuesIndex === -1) {
    throw new Error('Could not find VALUES clause in INSERT statement');
  }

  const insertPart = statement.substring(0, valuesIndex + 7); // Include " VALUES"
  const valuesPart = statement.substring(valuesIndex + 7).trim();

  // Split the values into individual rows: (...),(...),(...)
  const rows = [];
  let currentRow = '';
  let parenCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < valuesPart.length; i++) {
    const char = valuesPart[i];

    if (escapeNext) {
      escapeNext = false;
      currentRow += char;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      currentRow += char;
      continue;
    }

    if (char === "'" && !escapeNext) {
      inString = !inString;
    }

    if (!inString) {
      if (char === '(') parenCount++;
      else if (char === ')') parenCount--;
    }

    currentRow += char;

    // End of a row
    if (!inString && parenCount === 0 && char === ')') {
      // Look ahead for comma or end
      const nextChar = i + 1 < valuesPart.length ? valuesPart[i + 1] : '';
      if (nextChar === ',' || nextChar === ';' || i + 1 === valuesPart.length) {
        rows.push(currentRow.trim().replace(/^,\s*/, '').replace(/;\s*$/, ''));
        currentRow = '';
        if (nextChar === ',') i++; // Skip the comma
      }
    }
  }

  if (currentRow.trim()) {
    rows.push(currentRow.trim().replace(/^,\s*/, '').replace(/;\s*$/, ''));
  }

  console.log(`📊 Split into ${rows.length} rows`);

  // Execute in batches
  const batchSize = 50; // Start with small batches
  for (let i = 0; i < rows.length; i += batchSize) {
    const batchRows = rows.slice(i, i + batchSize);
    const batchStatement = insertPart + '\n' + batchRows.join(',\n') + ';';

    if (batchStatement.length > MAX_STATEMENT_SIZE) {
      // If even this batch is too large, reduce batch size
      const smallerBatchSize = Math.floor(batchSize / 2);
      if (smallerBatchSize < 1) {
        throw new Error('Individual row is too large for AWS RDS Data API');
      }

      // Re-process this batch with smaller size
      i -= batchSize; // Reset i to reprocess
      continue;
    }

    try {
      await db.execute(sql.raw(batchStatement));
      console.log(`  ✓ Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(rows.length/batchSize)} (rows ${i + 1}-${Math.min(i + batchSize, rows.length)})`);
    } catch (error) {
      console.error(`  ❌ Batch ${Math.floor(i/batchSize) + 1} failed. Stopping execution.`);
      console.error('Full error details:', error);

      // Log more details for debugging
      if (error instanceof Error && error.message.includes('syntax')) {
        console.error(`  📝 Problematic SQL (first 500 chars):`, batchStatement.substring(0, 500));
        console.error(`  📝 SQL ending:`, batchStatement.substring(batchStatement.length - 200));
      }

      throw error;
    }
  }

  console.log(`✓ Completed statement ${statementNum}/${totalStatements}`);
}

async function getTableCounts(db: AwsDataApiPgDatabase) {
  try {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM modifier_code`);

    // AWS Data API returns records as an array of Field arrays
    const count = result.records?.[0]?.[0]?.longValue ?? 0;

    return {
      modifier_codes: Number(count),
    };
  } catch (error) {
    console.error('Failed to get table counts:', error);
    return { modifier_codes: 0 };
  }
}

async function main() {
  try {
    // Initialize database connection with fresh environment variables
    const db = initializeDatabase();

    console.log('🚀 Starting modifier codes population...\n');

    // Get counts before
    const beforeCounts = await getTableCounts(db);
    console.log(`📊 Current modifier codes: ${beforeCounts.modifier_codes}\n`);

    // Look for SQL files (try multiple names)
    const possibleFiles = [
      'populate_modifier_codes.sql',
      'modifier_codes.sql',
      '../populate_modifier_codes.sql',
    ];

    let sqlFile = null;
    for (const fileName of possibleFiles) {
      const fullPath = path.resolve(fileName);
      if (fs.existsSync(fullPath)) {
        sqlFile = fullPath;
        break;
      }
    }

    if (!sqlFile) {
      console.log('⚠ No SQL file found. Available options:');
      console.log('1. Run the Python script to generate the SQL file:');
      console.log('   python3 scripts/process-modifier-codes.py');
      console.log('2. Or place your SQL file in one of these locations:');
      for (const f of possibleFiles) {
        console.log(`   - ${f}`);
      }
      process.exit(1);
    }

    console.log();

    // Execute the SQL file
    await executeSQLFile(db, sqlFile);

    // Get counts after
    const afterCounts = await getTableCounts(db);

    console.log('\n🎉 Modifier codes population completed!');
    console.log('📊 Final counts:');
    console.log(`   Modifier codes: ${afterCounts.modifier_codes} (added: ${afterCounts.modifier_codes - beforeCounts.modifier_codes})`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
