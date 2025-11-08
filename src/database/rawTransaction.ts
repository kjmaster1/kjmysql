import { getConnection } from './connection';
import { CFXCallback, CFXParameters, Transaction } from '../types';
import { parseTransaction } from '../utils/parseTransaction';
import { setCallback } from '../utils/setCallback';
import {logError, logQuery} from "../logger";
import {profileBatchStatements, runProfiler} from "../profiler";

export const rawTransaction = async (
    invokingResource: string,
    queries: Transaction,
    parameters: CFXParameters,
    cb?: CFXCallback,
) => {
    let transactions;
    cb = setCallback(parameters, cb);

    try {
        transactions = parseTransaction(queries, parameters);
    } catch (err: any) {
        return logError(invokingResource, cb, err);
    }

    // Get a connection that we will manually control
    using connection = await getConnection('write');

    if (!connection) {
        const msg = 'Database pool is not ready.';
        return logError(invokingResource, cb, msg);
    }

    let response = false;

    try {
        const hasProfiler = await runProfiler(connection, invokingResource);

        await connection.beginTransaction();

        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];

            const startTime = !hasProfiler && performance.now();
            await connection.query(transaction.query, transaction.params);

            if (hasProfiler && ((i > 0 && i % 100 === 0) || i === transactions.length - 1)) {
                await profileBatchStatements(connection, invokingResource, transactions, null, i < 100 ? 0 : i);
            } else if (startTime) {
                logQuery(invokingResource, transaction.query, performance.now() - startTime, transaction.params);
            }
        }

        await connection.commit();
        response = true;
    } catch (err: any) {
        // If any query fails, roll back all previous queries
        await connection.rollback();
        return logError(invokingResource, cb, err, 'Transaction Failed');
    }
    // The 'using' block ends here, and connection.[Symbol.dispose]() is
    // called automatically, releasing the connection to the pool.

    if (cb) {
        try {
            cb(response);
        } catch (err: any) {
            console.error(`[^1kjmysql^0] Error in callback for ${invokingResource}: ${err.message}`);
        }
    }

    return response;
};