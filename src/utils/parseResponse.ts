import { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { QueryResponse, QueryType } from '../types';

export const parseResponse = (type: QueryType, result: QueryResponse): any => {
    switch (type) {
        // For 'insert', return the insertId
        case 'insert':
            return (result as ResultSetHeader)?.insertId ?? null;

        // For 'update', return the number of affectedRows
        case 'update':
            return (result as ResultSetHeader)?.affectedRows ?? null;

        // For 'single', return the first row
        case 'single':
            return (result as RowDataPacket[])?.[0] ?? null;

        // For 'scalar', return the first value from the first row
        case 'scalar':
            const row = (result as RowDataPacket[])?.[0];
            return (row && Object.values(row)[0]) ?? null;

        // For 'execute' or null, return the full result
        default:
            return result ?? null;
    }
};