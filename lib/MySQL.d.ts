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
    private _state;
    constructor(tableName: string);
    select(...fields: string[]): this;
    where(field: string, operator: string, value: any): this;
    limit(count: number): this;
    insert(data: Record<string, any>): this;
    update(data: Record<string, any>): this;
    delete(): this;
    private _addJoin;
    join(table: string, field1: string, operator: string, field2: string): this;
    leftJoin(table: string, field1: string, operator: string, field2: string): this;
    groupBy(...fields: string[]): this;
    orderBy(field: string, direction?: 'ASC' | 'DESC'): this;
    all(): Promise<any[]>;
    first(): Promise<any>;
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
