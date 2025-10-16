#!/usr/bin/env tsx

/**
 * Script to populate ICD-10, CPT, and HCPCS code master tables from the generated SQL file.
 * This script handles the updated SQL format with all three medical code types.
 */

import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import {
  icd10CodeMaster,
  cptCodeMaster,
  hcpcsCodeMaster,
} from '../src';

const __dirname = process.cwd();

const client = new RDSDataClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
});

if (
  !process.env.DATABASE_NAME ||
  !process.env.DATABASE_SECRET_ARN ||
  !process.env.DATABASE_CLUSTER_ARN
) {
  throw new Error('Missing required AWS RDS environment variables');
}

const db = drizzle(client, {
  database: process.env.DATABASE_NAME ?? 'rcm',
  secretArn: process.env.DATABASE_SECRET_ARN,
  resourceArn: process.env.DATABASE_CLUSTER_ARN,
});

interface ICD10Code {
  code: string;
  shortDescription: string;
  longDescription: string;
  chapter: string;
  chapterRange: string;
  category: string;
  isBillable: boolean;
  requiresAdditionalDigit: boolean;
  effectiveDate: string;
}

interface CPTCode {
  code: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  effectiveDate: string;
}

interface HCPCSCode {
  code: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  level: string;
  actionCode?: string;
  effectiveDate: string;
}

function parseSQLFile(filePath: string): {
  icd10Codes: ICD10Code[],
  cptCodes: CPTCode[],
  hcpcsCodes: HCPCSCode[]
} {
  console.log(`Reading SQL file: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const icd10Codes: ICD10Code[] = [];
  const cptCodes: CPTCode[] = [];
  const hcpcsCodes: HCPCSCode[] = [];

  // Split by INSERT INTO statements
  const insertStatements = content.split(/INSERT INTO\s+/);

  for (const statement of insertStatements) {
    if (statement.includes('icd10_code_master')) {
      console.log('Processing ICD-10 codes section...');
      const codes = parseICD10Values(statement);
      icd10Codes.push(...codes);
    } else if (statement.includes('cpt_code_master')) {
      console.log('Processing CPT codes section...');
      const codes = parseCPTValues(statement);
      cptCodes.push(...codes);
    } else if (statement.includes('hcpcs_code_master')) {
      console.log('Processing HCPCS codes section...');
      const codes = parseHCPCSValues(statement);
      hcpcsCodes.push(...codes);
    }
  }

  console.log(`Parsed ${icd10Codes.length} ICD-10 codes, ${cptCodes.length} CPT codes, and ${hcpcsCodes.length} HCPCS codes`);
  return { icd10Codes, cptCodes, hcpcsCodes };
}

function parseICD10Values(statement: string): ICD10Code[] {
  const codes: ICD10Code[] = [];

  // Extract VALUES section
  const valuesMatch = statement.match(/VALUES\s*([\s\S]*?)(?:ON CONFLICT|$)/);
  if (!valuesMatch) return codes;

  const valuesSection = valuesMatch[1];

  // Split into individual value tuples
  const tuples = extractValueTuples(valuesSection);

  for (const tuple of tuples) {
    // Parse ICD-10 tuple format based on the Python script output
    const match = tuple.match(/^\s*'([^']+)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*[^,]*,\s*'([^']*)',\s*[^,]*,[\s\S]*?(true|false),[\s\S]*?(true|false),[\s\S]*?'([^']*)'/);

    if (match) {
      codes.push({
        code: match[1],
        shortDescription: match[2].replace(/''/g, "'"),
        longDescription: match[3].replace(/''/g, "'"),
        chapter: match[4].replace(/''/g, "'"),
        chapterRange: match[5].replace(/''/g, "'"),
        category: match[6].replace(/''/g, "'"),
        isBillable: match[7] === 'true',
        requiresAdditionalDigit: match[8] === 'true',
        effectiveDate: match[9],
      });
    }
  }

  return codes;
}

function parseCPTValues(statement: string): CPTCode[] {
  const codes: CPTCode[] = [];

  const valuesMatch = statement.match(/VALUES\s*([\s\S]*?)(?:ON CONFLICT|$)/);
  if (!valuesMatch) return codes;

  const valuesSection = valuesMatch[1];
  const tuples = extractValueTuples(valuesSection);

  for (const tuple of tuples) {
    // Parse CPT tuple format
    const match = tuple.match(/^\s*'([^']+)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',[\s\S]*?'([^']*)'/);

    if (match) {
      codes.push({
        code: match[1],
        shortDescription: match[2].replace(/''/g, "'"),
        longDescription: match[3].replace(/''/g, "'"),
        category: match[4].replace(/''/g, "'"),
        effectiveDate: match[5],
      });
    }
  }

  return codes;
}

function parseHCPCSValues(statement: string): HCPCSCode[] {
  const codes: HCPCSCode[] = [];

  const valuesMatch = statement.match(/VALUES\s*([\s\S]*?)(?:ON CONFLICT|$)/);
  if (!valuesMatch) return codes;

  const valuesSection = valuesMatch[1];
  const tuples = extractValueTuples(valuesSection);

  for (const tuple of tuples) {
    // Parse HCPCS tuple format
    const match = tuple.match(/^\s*'([^']+)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',[\s\S]*?'([^']*)'::date/);

    if (match) {
      codes.push({
        code: match[1],
        shortDescription: match[2].replace(/''/g, "'"),
        longDescription: match[3].replace(/''/g, "'"),
        category: match[4].replace(/''/g, "'"),
        level: 'II', // HCPCS Level II
        actionCode: match[5].replace(/''/g, "'") || undefined,
        effectiveDate: match[6],
      });
    }
  }

  return codes;
}

function extractValueTuples(valuesSection: string): string[] {
  const tuples: string[] = [];
  let currentTuple = '';
  let parenDepth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < valuesSection.length; i++) {
    const char = valuesSection[i];

    if (escapeNext) {
      currentTuple += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      currentTuple += char;
      continue;
    }

    if (char === "'" && !escapeNext) {
      inString = !inString;
    }

    if (!inString) {
      if (char === '(') {
        parenDepth++;
        if (parenDepth === 1) {
          currentTuple = '';
          continue;
        }
      } else if (char === ')') {
        parenDepth--;
        if (parenDepth === 0) {
          if (currentTuple.trim()) {
            tuples.push(currentTuple.trim());
          }
          currentTuple = '';
          continue;
        }
      }
    }

    if (parenDepth > 0) {
      currentTuple += char;
    }
  }

  return tuples;
}

async function populateICD10Codes(codes: ICD10Code[]) {
  console.log(`Populating ${codes.length} ICD-10 codes...`);

  const batchSize = 100;
  let processed = 0;

  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);

    try {
      await db.insert(icd10CodeMaster).values(
        batch.map(code => ({
          id: uuid(),
          icd10Code: code.code,
          shortDescription: code.shortDescription,
          longDescription: code.longDescription,
          chapter: code.chapter,
          chapterRange: code.chapterRange,
          category: code.category,
          codeType: 'diagnosis',
          // updateYear: 2025,
          isBillable: code.isBillable,
          requiresAdditionalDigit: code.requiresAdditionalDigit,
          isActive: true,
          effectiveDate: code.effectiveDate,
          usageCount: 0,
        }))
      );

      processed += batch.length;
      console.log(`Processed ${processed}/${codes.length} ICD-10 codes...`);
    } catch (error) {
      console.error(`Error inserting ICD-10 batch ${i}-${i + batch.length}:`, error);
    }
  }

  console.log('ICD-10 codes population completed');
}

async function populateCPTCodes(codes: CPTCode[]) {
  console.log(`Populating ${codes.length} CPT codes...`);

  const batchSize = 100;
  let processed = 0;

  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);

    try {
      await db.insert(cptCodeMaster).values(
        batch.map(code => ({
          id: uuid(),
          cptCode: code.code,
          shortDescription: code.shortDescription,
          longDescription: code.longDescription,
          category: code.category,
          isActive: true,
          effectiveDate: code.effectiveDate,
          usageCount: 0,
        }))
      );

      processed += batch.length;
      console.log(`Processed ${processed}/${codes.length} CPT codes...`);
    } catch (error) {
      console.error(`Error inserting CPT batch ${i}-${i + batch.length}:`, error);
    }
  }

  console.log('CPT codes population completed');
}

async function populateHCPCSCodes(codes: HCPCSCode[]) {
  console.log(`Populating ${codes.length} HCPCS codes...`);

  const batchSize = 100;
  let processed = 0;

  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);

    try {
      await db.insert(hcpcsCodeMaster).values(
        batch.map(code => ({
          id: uuid(),
          hcpcsCode: code.code,
          shortDescription: code.shortDescription,
          longDescription: code.longDescription,
          category: code.category,
          level: code.level,
          actionCode: code.actionCode,
          isActive: true,
          effectiveDate: code.effectiveDate,
          // updateYear: 2025,
          usageCount: 0,
        }))
      );

      processed += batch.length;
      console.log(`Processed ${processed}/${codes.length} HCPCS codes...`);
    } catch (error) {
      console.error(`Error inserting HCPCS batch ${i}-${i + batch.length}:`, error);
    }
  }

  console.log('HCPCS codes population completed');
}

async function main() {
  try {
    console.log("Starting medical codes population...");

    // Check if file exists
    const sqlFilePath = path.join(
      __dirname,
      "populate_medical_codes_updated.sql"
    );

    if (!fs.existsSync(sqlFilePath)) {
      console.error(`SQL file not found: ${sqlFilePath}`);
      console.log("Please run the Python script first to generate the SQL file:");
      console.log("python3 process-medical-codes-updated.py");
      throw new Error("SQL file not found");
    }

    // Parse the SQL file
    const { icd10Codes, cptCodes, hcpcsCodes } = parseSQLFile(sqlFilePath);

    if (icd10Codes.length === 0 && cptCodes.length === 0 && hcpcsCodes.length === 0) {
      console.error("No codes found in SQL file");
      throw new Error("No codes found in SQL file");
    }

    // Populate tables
    if (icd10Codes.length > 0) {
      await populateICD10Codes(icd10Codes);
    }

    if (cptCodes.length > 0) {
      await populateCPTCodes(cptCodes);
    }

    if (hcpcsCodes.length > 0) {
      await populateHCPCSCodes(hcpcsCodes);
    }

    console.log("Medical codes population completed successfully!");
    console.log(`Total ICD-10 codes: ${icd10Codes.length}`);
    console.log(`Total CPT codes: ${cptCodes.length}`);
    console.log(`Total HCPCS codes: ${hcpcsCodes.length}`);
  } catch (error) {
    console.error("Error populating medical codes:", error);
    process.exit(1);
  }
}

main();

export default main;
