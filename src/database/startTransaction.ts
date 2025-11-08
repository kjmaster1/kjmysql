import { MySql, getConnection } from './connection';
import { logError } from '../logger';
import { CFXCallback, CFXParameters } from '../types';
import { parseArguments } from '../utils/parseArguments';

/**
 * A helper function to run queries within the managed transaction.
 *
 */
async function runQuery(conn: MySql | null, sql: string, values?: CFXParameters) {
    [sql, values] = parseArguments(sql, values || []);

    try {
        if (!conn) throw new Error(`Connection used by transaction timed out after 30 seconds.`);
        return await conn.query(sql, values);
    } catch (err: any) {
        throw new Error(`Query: ${sql}\n${JSON.stringify(values)}\n${err.message}`);
    }
}

/**
 * Manages a transaction, providing a query function to a user's callback.
 *
 */
export const startTransaction = async (
    invokingResource: string,
    queries: (query: (sql: string, values?: CFXParameters) => Promise<any>) => Promise<boolean | void>,
    cb?: CFXCallback,
) => {
    using conn: MySql = await getConnection('write');
    let response: boolean | null = false;
    let closed = false;

    if (!conn) return;

    // Set a 30s timeout for the transaction
    setTimeout(() => (closed = true), 30000);

    try {
        await conn.beginTransaction();

        // Call the user's function, passing our runQuery helper
        const commit = await queries((sql: string, values?: CFXParameters) =>
            runQuery(closed ? null : conn, sql, values)
        );

        if (closed) throw new Error(`Transaction has timed out after 30 seconds.`);

        // If the user's function returns false, roll back
        if (commit === false) {
            await conn.rollback();
        } else {
            conn.commit();
            response = true;
        }
    } catch (err: any) {
        await conn.rollback();
        logError(invokingResource, cb, err, 'Transaction Failed');
    } finally {
        closed = true;
    }

    return cb ? cb(response) : response;
};