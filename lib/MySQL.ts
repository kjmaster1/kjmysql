export type Transaction =
    | string[]
    | [string, any[]][]
    | { query: string; values: any[] }[]
    | { query: string; parameters: any[] }[];

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

// --- Callback Exports ---
export function query(query: string, parameters: any, cb: (result: any) => void) {}
export function single(query: string, parameters: any, cb: (result: any) => void) {}
export function scalar(query: string, parameters: any, cb: (result: any) => void) {}
export function insert(query: string, parameters: any, cb: (result: number) => void) {}
export function update(query: string, parameters: any, cb: (result: number) => void) {}
export function transaction(queries: Transaction, parameters: any, cb: (result: boolean) => void) {}
export function prepare(query: string, parameters: any, cb: (result: any) => void) {}
export function rawExecute(query: string, parameters: any, cb: (result: any) => void) {}
export function startTransaction(
    queries: (query: (sql: string, values?: any) => Promise<any>) => Promise<boolean | void>,
    cb: (result: boolean) => void
) {}

/**
 * Overrides the default logger (console) with a custom provider.
 * @param provider An object with log, warn, and error methods.
 */
export function setLogger(provider: Partial<Logger>): void {}

// --- Async/Promise Exports ---
export function query_async(query: string, parameters?: any): Promise<any[]> { return Promise.resolve([]); }
export function single_async(query: string, parameters?: any): Promise<any> { return Promise.resolve(null); }
export function scalar_async(query: string, parameters?: any): Promise<any> { return Promise.resolve(null); }
export function insert_async(query: string, parameters?: any): Promise<number> { return Promise.resolve(0); }
export function update_async(query: string, parameters?: any): Promise<number> { return Promise.resolve(0); }
export function transaction_async(queries: Transaction, parameters?: any): Promise<boolean> { return Promise.resolve(false); }
export function prepare_async(query: string, parameters?: any): Promise<any> { return Promise.resolve(null); }
export function rawExecute_async(query: string, parameters?: any): Promise<any> { return Promise.resolve(null); }
export function startTransaction_async(
    queries: (query: (sql: string, values?: any) => Promise<any>) => Promise<boolean | void>
): Promise<boolean> { return Promise.resolve(false); }

// --- Cached Functions ---
export function query_cached(cacheKey: string, ttl: number, query: string, parameters?: any): Promise<any[]> { return Promise.resolve([]); }
export function single_cached(cacheKey: string, ttl: number, query: string, parameters?: any): Promise<any> { return Promise.resolve(null); }
export function scalar_cached(cacheKey: string, ttl: number, query: string, parameters?: any): Promise<any> { return Promise.resolve(null); }
export function clearCache(cacheKey?: string | string[]): void {}

// --- Query Builder ---

export class KjQuery {
    private _table: string;
    constructor(tableName: string) { this._table = tableName; }

    /**
     * Selects fields from the table.
     * @param fields Fields to select. Defaults to '*'.
     */
    select(...fields: string[]): this { return this; }

    /**
     * Adds a WHERE clause to the query.
     * @param field The column name.
     * @param operator The operator (e.g., '=', '>', 'IN').
     * @param value The value to test against.
     */
    where(field: string, operator: string, value: any): this { return this; }

    /**
     * Adds a LIMIT clause to the query.
     * @param count The number of rows to return.
     */
    limit(count: number): this { return this; }

    /**
     * Sets the query type to INSERT.
     * @param data An object of key/value pairs to insert.
     */
    insert(data: Record<string, any>): this { return this; }

    /**
     * Sets the query type to UPDATE.
     * @param data An object of key/value pairs to update.
     */
    update(data: Record<string, any>): this { return this; }

    /**
     * Sets the query type to DELETE.
     */
    delete(): this { return this; }

    /**
     * Performs an INNER JOIN on another table.
     * @param table The table to join.
     * @param field1 The first field to join on (e.g., 'users.id').
     * @param operator The join operator (e.g., '=').
     * @param field2 The second field to join on (e.g., 'inventory.owner').
     */
    join(table: string, field1: string, operator: string, field2: string): this { return this; }

    /**
     * Performs a LEFT JOIN on another table.
     * @param table The table to join.
     * @param field1 The first field to join on.
     * @param operator The join operator.
     * @param field2 The second field to join on.
     */
    leftJoin(table: string, field1: string, operator: string, field2: string): this { return this; }

    /**
     * Adds a GROUP BY clause to the query.
     * @param fields Fields to group by.
     */
    groupBy(...fields: string[]): this { return this; }

    /**
     * Adds an ORDER BY clause to the query.
     * @param field The field to order by.
     * @param direction The direction to sort (ASC or DESC).
     */
    orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this { return this; }

    /**
     * Executes a SELECT query and returns all matching rows.
     */
    all(): Promise<any[]> { return Promise.resolve([]); }

    /**
     * Executes a SELECT query and returns the first matching row.
     */
    first(): Promise<any> { return Promise.resolve(null); }

    /**
     * Executes an INSERT, UPDATE, or DELETE query.
     * @returns For INSERT, returns the insertId. For UPDATE/DELETE, returns affectedRows.
     */
    run(): Promise<number> { return Promise.resolve(0); }
}

/**
 * Creates a new query builder instance for a specific table.
 * @param tableName The name of the table to query.
 */
export function table(tableName: string): KjQuery { return new KjQuery(tableName); }

/**
 * Runs database migrations from a specified folder for a given resource.
 * Supports .sql files and .ts files that export an 'up' function.
 * @param resourceName The name of the resource running migrations (e.g., GetCurrentResourceName()).
 * @param migrationsPath The absolute path to the migrations folder (e.g., GetResourcePath(GetCurrentResourceName()) + '/migrations').
 */
export function runMigrations(resourceName: string, migrationsPath: string): Promise<void> { return Promise.resolve(); }