import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { migrate } from 'drizzle-orm/aws-data-api/pg/migrator';
import { execSync } from 'child_process';
import * as readline from 'readline';
import { config } from '@dotenvx/dotenvx';

// Load environment variables
config({ path: '.env.local' });

const rdsClient = new RDSDataClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const db = drizzle(rdsClient, {
  database: process.env.DATABASE_NAME!,
  secretArn: process.env.DATABASE_SECRET_ARN!,
  resourceArn: process.env.DATABASE_CLUSTER_ARN!,
});

async function resetDatabase() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const confirm = await new Promise<boolean>((resolve) => {
    rl.question('⚠️  This will DELETE all data. Continue? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });

  if (!confirm) {
    console.log('Aborted');
    process.exit(0);
  }

  try {
    console.log('Dropping all database objects...');
    await db.execute(sql`DROP SCHEMA public CASCADE`);
    await db.execute(sql`CREATE SCHEMA public`);
    await db.execute(sql`GRANT ALL ON SCHEMA public TO PUBLIC`);
    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);

    console.log('Generating fresh migrations...');
    execSync('rm -rf src/migrations/*', { cwd: process.cwd() });
    execSync('yarn drizzle-kit generate', { stdio: 'inherit' });

    console.log('Applying migrations...');
    await migrate(db, { migrationsFolder: './src/migrations' });

    console.log('✅ Database reset complete');
  } catch (error) {
    console.error('Reset failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  resetDatabase();
}
