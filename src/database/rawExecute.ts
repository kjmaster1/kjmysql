import { logError, logQuery } from '../logger';
import { CFXCallback, CFXParameters, QueryType } from '../types';
import { parseResponse } from '../utils/parseResponse';
import { executeType, parseExecute } from '../utils/parseExecute';
import { getConnection } from './connection';
import { setCallback } from '../utils/setCallback';
import { performance } from 'perf_hooks';
import validateResultSet from '../utils/validateResultSet';
import {profileBatchStatements, runProfiler} from "../profiler";

export const rawExecute = async (
    invokingResource: string,
    query: string,
    parameters: CFXParameters,
    cb?: CFXCallback,
) => {
    cb = setCallback(parameters, cb);

    let type: QueryType;
    let placeholders: number;
    let params: CFXParameters[];

    try {
        type = executeType(query);
        placeholders = query.split('?').length - 1;
        params = parseExecute(placeholders, parameters);
    } catch (err: any) {
        return logError(invokingResource, cb, err, query, parameters);
    }

    using connection = await getConnection(type === null ? 'read' : 'write');

    if (!connection) {
        return logError(invokingResource, cb, 'Database pool is not ready.');
    }

    try {
        const hasProfiler = await runProfiler(connection, invokingResource);
        const response: any[] = [];

        // Loop through each set of parameters (for batch operations)
        //
        for (let index = 0; index < params.length; index++) {
            const values = params[index];

            if (values && placeholders > values.length) {
                for (let i = values.length; i < placeholders; i++) {
                    values[i] = null;
                }
            }

            const startTime = !hasProfiler && performance.now();
            const result = await connection.execute(query, values);

            validateResultSet(invokingResource, query, result);

            response.push(parseResponse(type, result));

            if (hasProfiler && ((index > 0 && index % 100 === 0) || index === params.length - 1)) {
                await profileBatchStatements(connection, invokingResource, query, params, index < 100 ? 0 : index);
            } else if (startTime) {
                logQuery(invokingResource, query, performance.now() - startTime, values);
            }
        }

        // If only one query was run, don't return an array
        const finalResponse = response.length === 1 ? response[0] : response;

        if (cb) {
            return cb(finalResponse);
        } else {
            return finalResponse;
        }
    } catch (err: any) {
        return logError(invokingResource, cb, err, query, parameters);
    }
};