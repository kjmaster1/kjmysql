import type { OkPacket, ResultSetHeader, RowDataPacket, ProcedureCallPacket } from 'mysql2';

// A union of all possible successful response types from mysql2
export type QueryResponse =
    | OkPacket
    | ResultSetHeader
    | ResultSetHeader[]
    | RowDataPacket[]
    | RowDataPacket[][]
    | OkPacket[]
    | ProcedureCallPacket;

// Defines the 'parameters' type, which can be an array for '?' placeholders
export type CFXParameters = any[];

// Defines the shape of a FiveM-style callback
export type CFXCallback = (result: unknown, err?: string) => void;

// This will be used by rawQuery to determine how to format the result
export type QueryType = 'execute' | 'insert' | 'update' | 'scalar' | 'single' | null;

// Defines the allowed shapes for a transaction
export type Transaction =
    | string[]
    | [string, CFXParameters][]
    | { query: string; values: CFXParameters }[]
    | { query: string; parameters: CFXParameters }[];

// This is the object type *within* a transaction array
export type TransactionQuery = {
    query: string;
    parameters?: CFXParameters;
    values?: CFXParameters;
};