"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kjmysql = void 0;
class KjQuery {
    constructor(tableName) {
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
    select(...fields) {
        if (fields.length > 0) {
            this._state.fields = fields;
        }
        this._state.type = 'select';
        return this;
    }
    where(field, operator, value) {
        this._state.wheres.push({ field, operator, value });
        return this;
    }
    limit(count) {
        this._state.limit = count;
        return this;
    }
    insert(data) {
        this._state.type = 'insert';
        this._state.insertData = data;
        return this;
    }
    update(data) {
        this._state.type = 'update';
        this._state.updateData = data;
        return this;
    }
    delete() {
        this._state.type = 'delete';
        return this;
    }
    _addJoin(type, table, field1, operator, field2) {
        this._state.joins.push({ type, table, field1, operator, field2 });
        return this;
    }
    join(table, field1, operator, field2) {
        return this._addJoin('INNER', table, field1, operator, field2);
    }
    leftJoin(table, field1, operator, field2) {
        return this._addJoin('LEFT', table, field1, operator, field2);
    }
    groupBy(...fields) {
        this._state.groups.push(...fields);
        return this;
    }
    orderBy(field, direction = 'ASC') {
        this._state.orders.push({ field, direction });
        return this;
    }
    all() {
        if (this._state.type !== 'select')
            throw new Error('Cannot call .all() on a non-SELECT query');
        // 'exp' is global.exports.kjmysql
        return exp.execute_builder(this._state);
    }
    first() {
        this._state.limit = 1; // .first() implies limit 1
        if (this._state.type !== 'select')
            throw new Error('Cannot call .first() on a non-SELECT query');
        return exp.execute_builder(this._state);
    }
    run() {
        if (this._state.type === 'select')
            throw new Error('Cannot call .run() on a SELECT query. Use .all() or .first()');
        return exp.execute_builder(this._state);
    }
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
        return new KjQuery(tableName);
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
