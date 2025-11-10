type Query = string;
type CFXParameters = any[];
type CFXCallback = (result: unknown, err?: string) => void;

type Transaction =
    | string[]
    | [string, CFXParameters][]
    | { query: string; values: CFXParameters }[]
    | { query: string; parameters: CFXParameters }[];

class KjQuery {
    private _state: {
        table: string;
        fields: string[] | string;
        wheres: { field: string; operator: string; value: any }[];
        limit: number | null;
        type: 'select' | 'insert' | 'update' | 'delete';
        insertData: Record<string, any> | null;
        updateData: Record<string, any> | null;
        joins: { type: 'INNER' | 'LEFT'; table: string; field1: string; operator: string; field2: string }[];
        groups: string[];
        orders: { field: string; direction: 'ASC' | 'DESC' }[];
    };

    constructor(tableName: string) {
        this._state = {
            table: tableName,
            fields: ['*'],
            wheres: [],
            limit: null,
            type: 'select',
            insertData: null,
            updateData: null,
            joins: [],
            groups: [],
            orders: [],
        };
    }

    select(...fields: string[]): this {
        if (fields.length > 0) {
            this._state.fields = fields;
        }
        this._state.type = 'select';
        return this;
    }

    where(field: string, operator: string, value: any): this {
        this._state.wheres.push({ field, operator, value });
        return this;
    }

    limit(count: number): this {
        this._state.limit = count;
        return this;
    }

    insert(data: Record<string, any>): this {
        this._state.type = 'insert';
        this._state.insertData = data;
        return this;
    }

    update(data: Record<string, any>): this {
        this._state.type = 'update';
        this._state.updateData = data;
        return this;
    }

    delete(): this {
        this._state.type = 'delete';
        return this;
    }

    private _addJoin(type: 'INNER' | 'LEFT', table: string, field1: string, operator: string, field2: string): this {
        this._state.joins.push({ type, table, field1, operator, field2 });
        return this;
    }

    join(table: string, field1: string, operator: string, field2: string): this {
        return this._addJoin('INNER', table, field1, operator, field2);
    }

    leftJoin(table: string, field1: string, operator: string, field2: string): this {
        return this._addJoin('LEFT', table, field1, operator, field2);
    }

    groupBy(...fields: string[]): this {
        this._state.groups.push(...fields);
        return this;
    }

    orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
        this._state.orders.push({ field, direction });
        return this;
    }

    all(): Promise<any[]> {
        if (this._state.type !== 'select') throw new Error('Cannot call .all() on a non-SELECT query');
        // 'exp' is global.exports.kjmysql
        return exp.execute_builder(this._state);
    }

    first(): Promise<any> {
        this._state.limit = 1; // .first() implies limit 1
        if (this._state.type !== 'select') throw new Error('Cannot call .first() on a non-SELECT query');
        return exp.execute_builder(this._state);
    }

    run(): Promise<number> {
        if (this._state.type === 'select') throw new Error('Cannot call .run() on a SELECT query. Use .all() or .first()');
        return exp.execute_builder(this._state);
    }
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

const QueryStore: string[] = [];

function assert(condition: boolean, message: string) {
    if (!condition) throw new TypeError(message);
}

const safeArgs = (query: Query | Transaction, params?: any, cb?: Function, transaction?: true) => {
    if (typeof query === 'number') {
        query = QueryStore[query];
        assert(typeof query === 'string', 'First argument received invalid query store reference');
    }

    if (transaction) {
        assert(typeof query === 'object', `First argument expected object, recieved ${typeof query}`);
    } else {
        assert(typeof query === 'string', `First argument expected string, received ${typeof query}`);
    }

    if (params) {
        const paramType = typeof params;
        assert(
            paramType === 'object' || paramType === 'function',
            `Second argument expected object or function, received ${paramType}`
        );

        if (!cb && paramType === 'function') {
            cb = params;
            params = undefined;
        }
    }

    if (cb !== undefined) assert(typeof cb === 'function', `Third argument expected function, received ${typeof cb}`);

    return [query, params, cb];
};

declare var global: any;
const exp = global.exports.kjmysql;
const currentResourceName = GetCurrentResourceName();

function execute(method: string, query: Query | Transaction, params?: CFXParameters) {
    return new Promise((resolve, reject) => {
        exp[method](
            query,
            params,
            (result: unknown, error: any) => {
                if (error) return reject(error);
                resolve(result);
            },
            currentResourceName
        );
    }) as any;
}

export const kjmysql: KjMySQL = {
    store(query) {
        assert(typeof query !== 'string', `Query expects a string, received ${typeof query}`);

        return QueryStore.push(query);
    },
    ready(callback) {
        setImmediate(async () => {
            while (GetResourceState('kjmysql') !== 'started') await new Promise((resolve) => setTimeout(resolve, 50, null));
            callback();
        });
    },
    async query(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb);
        const result = await execute('query', query, params);
        return cb ? cb(result) : result;
    },
    async single(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb);
        const result = await execute('single', query, params);
        return cb ? cb(result) : result;
    },
    async scalar(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb);
        const result = await execute('scalar', query, params);
        return cb ? cb(result) : result;
    },
    async update(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb);
        const result = await execute('update', query, params);
        return cb ? cb(result) : result;
    },
    async insert(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb);
        const result = await execute('insert', query, params);
        return cb ? cb(result) : result;
    },
    async prepare(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb);
        const result = await execute('prepare', query, params);
        return cb ? cb(result) : result;
    },
    async rawExecute(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb);
        const result = await execute('rawExecute', query, params);
        return cb ? cb(result) : result;
    },
    async transaction(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb, true);
        const result = await execute('transaction', query, params);
        return cb ? cb(result) : result;
    },
    isReady() {
        return exp.isReady();
    },
    async awaitConnection() {
        return await exp.awaitConnection();
    },
    async startTransaction(transactions: () => Promise<boolean>, cb) {
        return exp.startTransaction(transactions, cb, currentResourceName);
    },
    table(tableName) {
        return new KjQuery(tableName);
    },
    async query_cached(cacheKey: string, ttl: number, query: string, parameters: CFXParameters) {
        return exp.query_cached(cacheKey, ttl, query, parameters);
    },
    async single_cached(cacheKey: string, ttl: number, query: string, parameters: CFXParameters) {
        return exp.single_cached(cacheKey, ttl, query, parameters);
    },
    async scalar_cached(cacheKey: string, ttl: number, query: string, parameters: CFXParameters) {
        return exp.scalar_cached(cacheKey, ttl, query, parameters);
    },
    clearCache(cacheKey?: string | string[]) {
        return exp.clearCache(cacheKey);
    },
    async runMigrations(resourceName: string, migrationsPath: string) {
        return exp.runMigrations(resourceName, migrationsPath);
    },
    setLogger(provider: Partial<Logger>) {
        return exp.setLogger(provider);
    }
};