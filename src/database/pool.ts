import { createPool } from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';
import { getPrimaryConnectionOptions, getReadConnectionOptions } from '../config';
import { loggingProvider } from '../logger';

// This export will hold our connection pool once it's created
export let pool: Pool;
export let readPool: Pool;
export let dbVersion = ''; // We can store the DB version for logging

async function testConnection(dbPool: Pool, poolName: string) {
    try {
        const [result] = (await dbPool.query('SELECT VERSION() as version')) as any[];
        const version = `[^5${result[0].version}^0]`;
        loggingProvider.log(`${version} ^2[${poolName}] Database server connection established!^0`);
        return version;
    } catch (err: any) {
        const message = err.message.includes('auth_gssapi_client')
            ? 'Requested authentication using unknown plugin auth_gssapi_client. (Did you forget to set a password?)'
            : err.message;

        loggingProvider.error(`^1[${poolName}] Unable to establish a connection to the database (${err.code})!^0`);
        loggingProvider.error(`^1[${poolName}] Error ${err.errno || ''}: ${message}^0`);
        throw err; // Re-throw to be caught by the connection loop
    }
}

/**
 * Creates the primary (write) connection pool.
 */
export async function createPrimaryPool() {
    const config = getPrimaryConnectionOptions();

    try {
        const dbPool = createPool(config);
        dbVersion = await testConnection(dbPool, 'Primary'); // Store version from primary
        pool = dbPool;
    } catch (err) {
        // Error is already logged by testConnection
    }
}

/**
 * Creates the read replica connection pool, if configured.
 */
export async function createReadPool() {
    const readConfig = getReadConnectionOptions();

    // If no read config is provided, just use the primary pool for reads
    if (!readConfig) {
        loggingProvider.log('^3[kjmysql] No read replica configured. All queries will use the primary pool.^0');
        readPool = pool;
        return;
    }

    // If read config is same as primary, don't create a new pool
    if (JSON.stringify(readConfig) === JSON.stringify(getPrimaryConnectionOptions())) {
        loggingProvider.log('^3[kjmysql] Read replica connection string is identical to primary. Re-using primary pool for all queries.^0');
        readPool = pool;
        return;
    }

    try {
        const dbPool = createPool(readConfig);
        await testConnection(dbPool, 'Read Replica');
        readPool = dbPool;
    } catch (err) {
        // If read replica fails, fall back to primary pool for reads
        loggingProvider.error('^1[kjmysql] Read replica connection failed. Falling back to primary pool for all queries.^0');
        readPool = pool;
    }
}