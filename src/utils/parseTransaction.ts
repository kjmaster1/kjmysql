import { CFXParameters, Transaction, TransactionQuery } from '../types';
import { parseArguments } from './parseArguments';

const isTransactionQuery = (query: any): query is TransactionQuery =>
    (query as TransactionQuery).query !== undefined;

export const parseTransaction = (queries: Transaction, parameters: CFXParameters) => {
    if (!Array.isArray(queries)) {
        throw new Error(`Transaction queries must be an array, received '${typeof queries}'.`);
    }

    if (!parameters || typeof parameters === 'function') parameters = [];

    // Handle format: [['SELECT * FROM users WHERE id = ?', [1]], ...]
    if (Array.isArray(queries[0])) {
        return (queries as [string, CFXParameters][]).map((query) => {
            const [parsedQuery, parsedParameters] = parseArguments(query[0], query[1]);
            return { query: parsedQuery, params: parsedParameters };
        });
    }

    // Handle format: [{ query: '...', values: [...] }, ...]
    // or format: ['SELECT * FROM users', 'DELETE ...']
    return (queries as (string | TransactionQuery)[]).map((query) => {
        const [parsedQuery, parsedParameters] = parseArguments(
            isTransactionQuery(query) ? query.query : query,
            isTransactionQuery(query) ? query.parameters || query.values : parameters
        );

        return { query: parsedQuery, params: parsedParameters };
    });
};