import type { PoolConnection } from 'mysql2/promise';
import { sleep } from '../utils/sleep';
import { pool, readPool } from './pool';
import type { CFXParameters } from '../types';
import {typeCastExecute} from "../utils/typeCast";

// Add Symbol.dispose polyfill if not present
(Symbol as any).dispose ??= Symbol('Symbol.dispose');

/**
 * Wraps a mysql2 PoolConnection to add transaction helpers
 * and implement the [Symbol.dispose] method for 'using' statements.
 *
 */
export class MySql {
    id: number;
    connection: PoolConnection;
    transaction?: boolean;

    constructor(connection: PoolConnection) {
        this.id = connection.threadId;
        this.connection = connection;
    }

    async query(query: string, values: CFXParameters = []) {
        const [result] = await this.connection.query(query, values);
        return result;
    }

    async execute(query: string, values: CFXParameters = []) {
        const [result] = await this.connection.execute({
            sql: query,
            values: values,
            typeCast: typeCastExecute,
        });
        return result;
    }

    beginTransaction() {
        this.transaction = true;
        return this.connection.beginTransaction();
    }

    rollback() {
        delete this.transaction;
        return this.connection.rollback();
    }

    commit() {
        delete this.transaction;
        return this.connection.commit();
    }

    /**
     * This method is called automatically when exiting a 'using' block.
     * It ensures the connection is always released back to the pool.
     *
     */
    [Symbol.dispose]() {
        if (this.transaction) {
            console.warn(`[^3kjmysql^0] Transaction for connection ${this.id} was not committed or rolled back. Auto-rolling back.`);
            this.rollback().catch(console.error);
        }
        this.connection.release();
    }
}

/**
 * Gets a new connection from the correct pool based on query intent.
 * 'read' queries will use the readPool if available.
 * 'write' queries will always use the primary pool.
 */
// --- UPDATE THIS FUNCTION ---
export async function getConnection(intent: 'read' | 'write' = 'write') {
    // Determine which pool to use
    // Use readPool if intent is 'read' AND readPool is available
    // Otherwise, always fall back to the primary 'pool'
    const poolToUse = (intent === 'read' && readPool) ? readPool : pool;

    // Wait for the selected pool to be ready
    // (The index.ts loop guarantees 'pool' will be ready, and 'readPool' will be ready or alias 'pool')
    while (!poolToUse) await sleep(0);

    const connection = await poolToUse.getConnection();
    return new MySql(connection as PoolConnection);
}