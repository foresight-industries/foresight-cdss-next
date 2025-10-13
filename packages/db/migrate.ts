import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { migrate } from 'drizzle-orm/aws-data-api/pg/migrator';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { config } from '@dotenvx/dotenvx';

config({
  path: '.env.local',
});

if (!process.env.DATABASE_NAME) {
  throw new Error('DATABASE_NAME is not defined');
}

if (!process.env.DATABASE_CLUSTER_ARN) {
  throw new Error('DATABASE_CLUSTER_ARN is not defined');
}

if (!process.env.DATABASE_SECRET_ARN) {
  throw new Error('DATABASE_SECRET_ARN is not defined');
}

const rdsClient = new RDSDataClient({});

const db = drizzle(rdsClient, {
  database: process.env.DATABASE_NAME,
  resourceArn: process.env.DATABASE_CLUSTER_ARN,
  secretArn: process.env.DATABASE_SECRET_ARN,
});

async function main() {
  console.log('Running migrations...');

  try {
    await migrate(db, { migrationsFolder: './src/migrations' });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
