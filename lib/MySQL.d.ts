export type Transaction = string[] | [string, any[]][] | {
    query: string;
    values: any[];
}[] | {
    query: string;
    parameters: any[];
}[];
/**
 * Provides a simple, transaction-safe database executor
 * passed to TypeScript-based migration files.
 */
export interface MigrationExecutor {
    query(sql: string, values?: any[]): Promise<any>;
    execute(sql: string, values?: any[]): Promise<any>;
}
export interface Logger {
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
}
export type MigrationUpFunction = (db: MigrationExecutor) => Promise<void>;
export declare function query(query: string, parameters: any, cb: (result: any) => void): void;
export declare function single(query: string, parameters: any, cb: (result: any) => void): void;
export declare function scalar(query: string, parameters: any, cb: (result: any) => void): void;
export declare function insert(query: string, parameters: any, cb: (result: number) => void): void;
export declare function update(query: string, parameters: any, cb: (result: number) => void): void;
export declare function transaction(queries: Transaction, parameters: any, cb: (result: boolean) => void): void;
export declare function prepare(query: string, parameters: any, cb: (result: any) => void): void;
export declare function rawExecute(query: string, parameters: any, cb: (result: any) => void): void;
export declare function startTransaction(queries: (query: (sql: string, values?: any) => Promise<any>) => Promise<boolean | void>, cb: (result: boolean) => void): void;
/**
 * Overrides the default logger (console) with a custom provider.
 * @param provider An object with log, warn, and error methods.
 */
export declare function setLogger(provider: Partial<Logger>): void;
export declare function query_async(query: string, parameters?: any): Promise<any[]>;
export declare function single_async(query: string, parameters?: any): Promise<any>;
export declare function scalar_async(query: string, parameters?: any): Promise<any>;
export declare function insert_async(query: string, parameters?: any): Promise<number>;
export declare function update_async(query: string, parameters?: any): Promise<number>;
export declare function transaction_async(queries: Transaction, parameters?: any): Promise<boolean>;
export declare function prepare_async(query: string, parameters?: any): Promise<any>;
export declare function rawExecute_async(query: string, parameters?: any): Promise<any>;
export declare function startTransaction_async(queries: (query: (sql: string, values?: any) => Promise<any>) => Promise<boolean | void>): Promise<boolean>;
export declare function query_cached(cacheKey: string, ttl: number, query: string, parameters?: any): Promise<any[]>;
export declare function single_cached(cacheKey: string, ttl: number, query: string, parameters?: any): Promise<any>;
export declare function scalar_cached(cacheKey: string, ttl: number, query: string, parameters?: any): Promise<any>;
export declare function clearCache(cacheKey?: string | string[]): void;
export declare class KjQuery {
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
/**
 * Creates a new query builder instance for a specific table.
 * @param tableName The name of the table to query.
 */
export declare function table(tableName: string): KjQuery;
/**
 * Runs database migrations from a specified folder for a given resource.
 * Supports .sql files and .ts files that export an 'up' function.
 * @param resourceName The name of the resource running migrations (e.g., GetCurrentResourceName()).
 * @param migrationsPath The absolute path to the migrations folder (e.g., GetResourcePath(GetCurrentResourceName()) + '/migrations').
 */
export declare function runMigrations(resourceName: string, migrationsPath: string): Promise<void>;
