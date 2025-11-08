import { CFXParameters, QueryType } from '../types';

/**
 * Determines the query type from the first word.
 *
 */
export const executeType = (query: string): QueryType => {
    if (typeof query !== 'string') throw new Error(`Expected query to be a string but received ${typeof query} instead.`);

    switch (query.substring(0, query.indexOf(' ')).toUpperCase()) {
        case 'INSERT':
            return 'insert';
        case 'UPDATE':
        case 'DELETE':
            return 'update';
        default:
            return null;
    }
};

/**
 * Formats parameters for a batch execute.
 * Ensures the final parameters are an array of arrays.
 *
 */
export const parseExecute = (placeholders: number, parameters: CFXParameters): CFXParameters[] => {
    if (!parameters || parameters.length === 0) return [[]];

    // Check if parameters are already a 2D array (batch)
    if (Array.isArray(parameters[0])) {
        return parameters;
    }

    // Check if parameters are an object for named placeholders
    if (typeof parameters === 'object' && !Array.isArray(parameters)) {
        const arr: unknown[] = [];
        for (let i = 0; i < placeholders; i++) {
            arr[i] = parameters[i + 1] ?? null;
        }
        parameters = arr;
    }

    // Wrap a single parameter array into a 2D array
    return [parameters];
};