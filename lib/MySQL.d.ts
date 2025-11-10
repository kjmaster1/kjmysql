type CFXParameters = any[];
type CFXCallback = (result: unknown, err?: string) => void;
type Transaction = string[] | [string, CFXParameters][] | {
    query: string;
    values: CFXParameters;
}[] | {
    query: string;
    parameters: CFXParameters;
}[];
declare class KjQuery {
    private _table;
    constructor(tableName: string);
    /**
     * Selects fields from the table.
     * @param fields Fields to select. Defaults to '*'.
     */
    select(...fields: string[]): this;
    /**
     * Adds a WHERE clause to the query.
     * @param field The column name.
     * @param operator The operator (e.g., '=', '>', 'IN').
     * @param value The value to test against.
     */
    where(field: string, operator: string, value: any): this;
    /**
     * Adds a LIMIT clause to the query.
     * @param count The number of rows to return.
     */
    limit(count: number): this;
    /**
     * Sets the query type to INSERT.
     * @param data An object of key/value pairs to insert.
     */
    insert(data: Record<string, any>): this;
    /**
     * Sets the query type to UPDATE.
     * @param data An object of key/value pairs to update.
     */
    update(data: Record<string, any>): this;
    /**
     * Sets the query type to DELETE.
     */
    delete(): this;
    /**
     * Performs an INNER JOIN on another table.
     * @param table The table to join.
     * @param field1 The first field to join on (e.g., 'users.id').
     * @param operator The join operator (e.g., '=').
     * @param field2 The second field to join on (e.g., 'inventory.owner').
     */
    join(table: string, field1: string, operator: string, field2: string): this;
    /**
     * Performs a LEFT JOIN on another table.
     * @param table The table to join.
     * @param field1 The first field to join on.
     * @param operator The join operator.
     * @param field2 The second field to join on.
     */
    leftJoin(table: string, field1: string, operator: string, field2: string): this;
    /**
     * Adds a GROUP BY clause to the query.
     * @param fields Fields to group by.
     */
    groupBy(...fields: string[]): this;
    /**
     * Adds an ORDER BY clause to the query.
     * @param field The field to order by.
     * @param direction The direction to sort (ASC or DESC).
     */
    orderBy(field: string, direction?: 'ASC' | 'DESC'): this;
    /**
     * Executes a SELECT query and returns all matching rows.
     */
    all(): Promise<any[]>;
    /**
     * Executes a SELECT query and returns the first matching row.
     */
    first(): Promise<any>;
    /**
     * Executes an INSERT, UPDATE, or DELETE query.
     * @returns For INSERT, returns the insertId. For UPDATE/DELETE, returns affectedRows.
     */
    run(): Promise<number>;
}
interface Logger {
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
}
interface KjMySQL {
    store: (query: string, cb: Function) => void;
    ready: (callback: () => void) => void;
    isReady: () => boolean;
    awaitConnection: () => Promise<true>;
    query: (query: string, parameters: CFXParameters, cb: CFXCallback) => Promise<any>;
    single: (query: string, parameters: CFXParameters, cb: CFXCallback) => Promise<any>;
    scalar: (query: string, parameters: CFXParameters, cb: CFXCallback) => Promise<any>;
    insert: (query: string, parameters: CFXParameters, cb: CFXCallback) => Promise<any>;
    update: (query: string, parameters: CFXParameters, cb: CFXCallback) => Promise<any>;
    transaction: (queries: Transaction, parameters: CFXParameters, cb: CFXCallback) => Promise<true | void>;
    startTransaction: (transactions: () => Promise<boolean>, cb: CFXCallback) => Promise<boolean | void>;
    prepare: (query: string, parameters: CFXParameters, cb: CFXCallback) => Promise<any>;
    rawExecute: (query: string, parameters: CFXParameters, cb: CFXCallback) => Promise<any>;
    table: (tableName: string) => KjQuery;
    query_cached: (cacheKey: string, ttl: number, query: string, parameters: CFXParameters) => Promise<any>;
    single_cached: (cacheKey: string, ttl: number, query: string, parameters: CFXParameters) => Promise<any>;
    scalar_cached: (cacheKey: string, ttl: number, query: string, parameters: CFXParameters) => Promise<any>;
    clearCache: (cacheKey?: string | string[]) => void;
    runMigrations: (resourceName: string, migrationsPath: string) => Promise<void>;
    setLogger: (logger: Logger) => void;
}
export declare const kjmysql: KjMySQL;
export {};
