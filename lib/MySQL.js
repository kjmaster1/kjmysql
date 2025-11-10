"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kjmysql = void 0;
class KjQuery {
    constructor(tableName) { this._table = tableName; }
    /**
     * Selects fields from the table.
     * @param fields Fields to select. Defaults to '*'.
     */
    select(...fields) { return this; }
    /**
     * Adds a WHERE clause to the query.
     * @param field The column name.
     * @param operator The operator (e.g., '=', '>', 'IN').
     * @param value The value to test against.
     */
    where(field, operator, value) { return this; }
    /**
     * Adds a LIMIT clause to the query.
     * @param count The number of rows to return.
     */
    limit(count) { return this; }
    /**
     * Sets the query type to INSERT.
     * @param data An object of key/value pairs to insert.
     */
    insert(data) { return this; }
    /**
     * Sets the query type to UPDATE.
     * @param data An object of key/value pairs to update.
     */
    update(data) { return this; }
    /**
     * Sets the query type to DELETE.
     */
    delete() { return this; }
    /**
     * Performs an INNER JOIN on another table.
     * @param table The table to join.
     * @param field1 The first field to join on (e.g., 'users.id').
     * @param operator The join operator (e.g., '=').
     * @param field2 The second field to join on (e.g., 'inventory.owner').
     */
    join(table, field1, operator, field2) { return this; }
    /**
     * Performs a LEFT JOIN on another table.
     * @param table The table to join.
     * @param field1 The first field to join on.
     * @param operator The join operator.
     * @param field2 The second field to join on.
     */
    leftJoin(table, field1, operator, field2) { return this; }
    /**
     * Adds a GROUP BY clause to the query.
     * @param fields Fields to group by.
     */
    groupBy(...fields) { return this; }
    /**
     * Adds an ORDER BY clause to the query.
     * @param field The field to order by.
     * @param direction The direction to sort (ASC or DESC).
     */
    orderBy(field, direction = 'ASC') { return this; }
    /**
     * Executes a SELECT query and returns all matching rows.
     */
    all() { return Promise.resolve([]); }
    /**
     * Executes a SELECT query and returns the first matching row.
     */
    first() { return Promise.resolve(null); }
    /**
     * Executes an INSERT, UPDATE, or DELETE query.
     * @returns For INSERT, returns the insertId. For UPDATE/DELETE, returns affectedRows.
     */
    run() { return Promise.resolve(0); }
}
const QueryStore = [];
function assert(condition, message) {
    if (!condition)
        throw new TypeError(message);
}
const safeArgs = (query, params, cb, transaction) => {
    if (typeof query === 'number') {
        query = QueryStore[query];
        assert(typeof query === 'string', 'First argument received invalid query store reference');
    }
    if (transaction) {
        assert(typeof query === 'object', `First argument expected object, recieved ${typeof query}`);
    }
    else {
        assert(typeof query === 'string', `First argument expected string, received ${typeof query}`);
    }
    if (params) {
        const paramType = typeof params;
        assert(paramType === 'object' || paramType === 'function', `Second argument expected object or function, received ${paramType}`);
        if (!cb && paramType === 'function') {
            cb = params;
            params = undefined;
        }
    }
    if (cb !== undefined)
        assert(typeof cb === 'function', `Third argument expected function, received ${typeof cb}`);
    return [query, params, cb];
};
const exp = global.exports.kjmysql;
const currentResourceName = GetCurrentResourceName();
function execute(method, query, params) {
    return new Promise((resolve, reject) => {
        exp[method](query, params, (result, error) => {
            if (error)
                return reject(error);
            resolve(result);
        }, currentResourceName);
    });
}
exports.kjmysql = {
    store(query) {
        assert(typeof query !== 'string', `Query expects a string, received ${typeof query}`);
        return QueryStore.push(query);
    },
    ready(callback) {
        setImmediate(async () => {
            while (GetResourceState('kjmysql') !== 'started')
                await new Promise((resolve) => setTimeout(resolve, 50, null));
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
    async startTransaction(transactions, cb) {
        return exp.startTransaction(transactions, cb, currentResourceName);
    },
    table(tableName) {
        return exp.table(tableName);
    },
    async query_cached(cacheKey, ttl, query, parameters) {
        return exp.query_cached(cacheKey, ttl, query, parameters);
    },
    async single_cached(cacheKey, ttl, query, parameters) {
        return exp.single_cached(cacheKey, ttl, query, parameters);
    },
    async scalar_cached(cacheKey, ttl, query, parameters) {
        return exp.scalar_cached(cacheKey, ttl, query, parameters);
    },
    clearCache(cacheKey) {
        return exp.clearCache(cacheKey);
    },
    async runMigrations(resourceName, migrationsPath) {
        return exp.runMigrations(resourceName, migrationsPath);
    },
    setLogger(provider) {
        return exp.setLogger(provider);
    }
};
