"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KjQuery = void 0;
exports.query = query;
exports.single = single;
exports.scalar = scalar;
exports.insert = insert;
exports.update = update;
exports.transaction = transaction;
exports.prepare = prepare;
exports.rawExecute = rawExecute;
exports.startTransaction = startTransaction;
exports.setLogger = setLogger;
exports.query_async = query_async;
exports.single_async = single_async;
exports.scalar_async = scalar_async;
exports.insert_async = insert_async;
exports.update_async = update_async;
exports.transaction_async = transaction_async;
exports.prepare_async = prepare_async;
exports.rawExecute_async = rawExecute_async;
exports.startTransaction_async = startTransaction_async;
exports.query_cached = query_cached;
exports.single_cached = single_cached;
exports.scalar_cached = scalar_cached;
exports.clearCache = clearCache;
exports.table = table;
exports.runMigrations = runMigrations;
// --- Callback Exports ---
function query(query, parameters, cb) { }
function single(query, parameters, cb) { }
function scalar(query, parameters, cb) { }
function insert(query, parameters, cb) { }
function update(query, parameters, cb) { }
function transaction(queries, parameters, cb) { }
function prepare(query, parameters, cb) { }
function rawExecute(query, parameters, cb) { }
function startTransaction(queries, cb) { }
/**
 * Overrides the default logger (console) with a custom provider.
 * @param provider An object with log, warn, and error methods.
 */
function setLogger(provider) { }
// --- Async/Promise Exports ---
function query_async(query, parameters) { return Promise.resolve([]); }
function single_async(query, parameters) { return Promise.resolve(null); }
function scalar_async(query, parameters) { return Promise.resolve(null); }
function insert_async(query, parameters) { return Promise.resolve(0); }
function update_async(query, parameters) { return Promise.resolve(0); }
function transaction_async(queries, parameters) { return Promise.resolve(false); }
function prepare_async(query, parameters) { return Promise.resolve(null); }
function rawExecute_async(query, parameters) { return Promise.resolve(null); }
function startTransaction_async(queries) { return Promise.resolve(false); }
// --- Cached Functions ---
function query_cached(cacheKey, ttl, query, parameters) { return Promise.resolve([]); }
function single_cached(cacheKey, ttl, query, parameters) { return Promise.resolve(null); }
function scalar_cached(cacheKey, ttl, query, parameters) { return Promise.resolve(null); }
function clearCache(cacheKey) { }
// --- Query Builder ---
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
exports.KjQuery = KjQuery;
/**
 * Creates a new query builder instance for a specific table.
 * @param tableName The name of the table to query.
 */
function table(tableName) { return new KjQuery(tableName); }
/**
 * Runs database migrations from a specified folder for a given resource.
 * Supports .sql files and .ts files that export an 'up' function.
 * @param resourceName The name of the resource running migrations (e.g., GetCurrentResourceName()).
 * @param migrationsPath The absolute path to the migrations folder (e.g., GetResourcePath(GetCurrentResourceName()) + '/migrations').
 */
function runMigrations(resourceName, migrationsPath) { return Promise.resolve(); }
