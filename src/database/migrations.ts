import { pool } from './pool';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { loggingProvider } from '../logger';

const MIGRATIONS_TABLE = '_kjmysql_migrations';

/**
 * Defines the database executor object that is passed
 * to TypeScript-based migration 'up' functions.
 * It's intentionally limited to the primary pool.
 */
const db = {
    query: (sql: string, values?: any[]) => {
        return pool.query(sql, values);
    },
    execute: (sql: string, values?: any[]) => {
        return pool.execute(sql, values);
    },
};

export type MigrationExecutor = typeof db;

/**
 * Ensures the migration tracking table exists in the database.
 */
async function ensureMigrationsTable() {
    const sql = `
    CREATE TABLE IF NOT EXISTS \`${MIGRATIONS_TABLE}\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`resource\` VARCHAR(128) NOT NULL,
      \`migration\` VARCHAR(255) NOT NULL,
      \`run_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      INDEX \`idx_resource_migration\` (\`resource\`, \`migration\`)
    ) ENGINE=InnoDB;
  `;
    try {
        await pool.query(sql);
    } catch (e: any) {
        loggingProvider.error(`[^1kjmysql^0] FAILED to create migrations table. Migrations will not run. Error: ${e.message}`);
        throw e; // Stop execution if we can't even create the table
    }
}

/**
 * The main migration runner exported to other resources.
 */
export async function runMigrations(resourceName: string, migrationsPath: string) {
    if (!pool) {
        loggingProvider.log(`[^3kjmysql^0] [${resourceName}] Waiting for database pool to be ready for migrations...`);
        await new Promise(res => setTimeout(res, 1000));
        return runMigrations(resourceName, migrationsPath);
    }

    try {
        await ensureMigrationsTable();

        // 1. Get all migrations that have already been run
        const [runRows] = (await pool.query(
            `SELECT \`migration\` FROM \`${MIGRATIONS_TABLE}\` WHERE \`resource\` = ?`,
            [resourceName]
        )) as any[];
        const runFiles: Set<string> = new Set(runRows.map((r: any) => r.migration));

        // 2. Read all files from the directory
        let allFiles: string[];
        try {
            allFiles = await readdir(migrationsPath);
        } catch (e: any) {
            if (e.code === 'ENOENT') {
                loggingProvider.log(`[^3kjmysql^0] [${resourceName}] No 'migrations' folder found at ${migrationsPath}. Skipping.`);
                return;
            }
            throw e;
        }

        // 3. Filter for new .sql AND .ts files and sort them
        const newFiles = allFiles
            .filter(file => (file.endsWith('.sql') || file.endsWith('.ts')) && !file.endsWith('.d.ts') && !runFiles.has(file))
            .sort();

        if (newFiles.length === 0) {
            loggingProvider.log(`[^2kjmysql^0] [${resourceName}] Database schema is up to date.`);
            return;
        }

        loggingProvider.log(`[^3kjmysql^0] [${resourceName}] Found ${newFiles.length} new migration(s) to run.`);

        // 4. Run each new migration file
        for (const file of newFiles) {
            loggingProvider.log(`[^3kjmysql^0] [${resourceName}] Running migration: ${file}...`);

            if (file.endsWith('.sql')) {
                // --- .sql file logic ---
                const sqlContent = await readFile(join(migrationsPath, file), 'utf-8');
                await pool.query(sqlContent);
            } else if (file.endsWith('.ts')) {
                // --- .ts file logic ---
                const filePath = join(migrationsPath, file);
                // We must use a file URL for dynamic import()
                const fileUrl = pathToFileURL(filePath).href;

                const module = await import(fileUrl);

                if (typeof module.up !== 'function') {
                    throw new Error(`Migration file ${file} is missing an "export async function up(db) { ... }"`);
                }

                // Pass our simple db executor to the 'up' function
                await module.up(db);
            }

            // 5. If successful, record it in the database
            await pool.query(
                `INSERT INTO \`${MIGRATIONS_TABLE}\` (\`resource\`, \`migration\`) VALUES (?, ?)`,
                [resourceName, file]
            );
            loggingProvider.log(`[^2kjmysql^0] [${resourceName}] Successfully ran ${file}.`);
        }

        loggingProvider.log(`[^2kjmysql^0] [${resourceName}] All migrations completed successfully.`);

    } catch (e: any) {
        loggingProvider.error(`[^1kjmysql^0] [${resourceName}] FAILED to run migrations. Error: ${e.message}`);
        loggingProvider.error(`[^1kjmysql^0] [${resourceName}] Please check your migration files for errors. No further migrations for this resource will be run until this is fixed.`);
    }
}