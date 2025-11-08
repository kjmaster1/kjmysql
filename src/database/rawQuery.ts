import {parseArguments} from '../utils/parseArguments';
import {setCallback} from '../utils/setCallback';
import {parseResponse} from '../utils/parseResponse';
import type {CFXCallback, CFXParameters, QueryType} from '../types';
import {getConnection} from "./connection";
import { performance } from 'perf_hooks';
import { logError, logQuery } from '../logger';
import validateResultSet from '../utils/validateResultSet';
import {runProfiler} from "../profiler";
import {RowDataPacket} from "mysql2";

export const rawQuery = async (
    type: QueryType,
    invokingResource: string,
    query: string,
    parameters: CFXParameters,
    cb?: CFXCallback,
) => {
    // 1. Handle optional callback
    cb = setCallback(parameters, cb);

    try {
        // 2. Ensure parameters are valid
        [query, parameters] = parseArguments(query, parameters);
    } catch (err: any) {
        return logError(invokingResource, cb, err, query, parameters);
    }

    const isSelect = query.trim().toUpperCase().startsWith('SELECT');
    using connection = await getConnection(isSelect ? 'read' : 'write');

    if (!connection) {
        const msg = 'Database pool is not ready.';
        return logError(invokingResource, cb, msg);
    }

    try {
        const hasProfiler = await runProfiler(connection, invokingResource);
        const startTime = !hasProfiler && performance.now();

        // 4. Execute the query
        const result = await connection.query(query, parameters);

        if (hasProfiler) {
            const profiler = <RowDataPacket[]>(
                await connection.query('SELECT FORMAT(SUM(DURATION) * 1000, 4) AS `duration` FROM INFORMATION_SCHEMA.PROFILING')
            );
            if (profiler[0]) logQuery(invokingResource, query, parseFloat(profiler[0].duration), parameters);
        } else if (startTime) {
            logQuery(invokingResource, query, performance.now() - startTime, parameters);
        }

        validateResultSet(invokingResource, query, result);

        // 5. Format the response based on the query type
        const response = parseResponse(type, result);

        if (cb) {
            cb(response); // Send response to callback
        } else {
            return response; // Return response for promises
        }

    } catch (err: any) {
        // 6. Handle query errors
        return logError(invokingResource, cb, err, query, parameters);
    }
};