import { mysql_debug } from '../config';
import type { MySql } from '../database/connection';
import { logQuery } from '../logger';
import type { RowDataPacket } from 'mysql2';
import type { CFXParameters } from '../types';

// SQL commands to clear history and enable profiling for the session
const profilerStatements = [
    'SET profiling_history_size = 0',
    'SET profiling = 0',
    'SET profiling_history_size = 100',
    'SET profiling = 1',
];

/**
 * Enables the MySQL profiler for a connection if mysql_debug is on.
 *
 */
export async function runProfiler(connection: MySql, invokingResource: string) {
    if (!mysql_debug) return;

    // We can expand this later to support array-based debug
    // if (Array.isArray(mysql_debug) && !mysql_debug.includes(invokingResource)) return;

    for (const statement of profilerStatements) {
        await connection.query(statement);
    }

    return true;
}

/**
 * Fetches profiling data for batch 'execute' or 'transaction' statements.
 *
 */
export async function profileBatchStatements(
    connection: MySql,
    invokingResource: string,
    query: string | { query: string; params?: CFXParameters }[],
    parameters: CFXParameters | null,
    offset: number
) {
    const profiler = <RowDataPacket[]>(
        await connection.query(
            'SELECT FORMAT(SUM(DURATION) * 1000, 4) AS `duration` FROM INFORMATION_SCHEMA.PROFILING GROUP BY QUERY_ID'
        )
    );

    // Reset profiler for next batch
    for (const statement of profilerStatements) {
        await connection.query(statement);
    }

    if (profiler.length === 0) return;

    if (typeof query === 'string' && parameters) {
        // This is from rawExecute
        for (let i = 0; i < profiler.length; i++) {
            logQuery(invokingResource, query, parseFloat(profiler[i].duration), parameters[offset + i]);
        }
        return;
    }

    if (typeof query === 'object' && Array.isArray(query)) {
        // This is from rawTransaction
        for (let i = 0; i < profiler.length; i++) {
            const transaction = query[offset + i];
            if (!transaction) break;
            logQuery(invokingResource, transaction.query, parseFloat(profiler[i].duration), transaction.params);
        }
    }
}