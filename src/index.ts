import './update';
import './database';
import {pool, rawExecute, rawQuery, rawTransaction, startTransaction} from './database';
import type {CFXCallback, CFXParameters, Transaction} from './types';
import ghmatti from './compatibility/ghmattimysql';
import mysqlAsync from './compatibility/mysql-async';
import {KjQuery, setBuilderExecutors} from './database/builder';
import {cache} from './database/cache';
import {Logger, loggingProvider, setLogger} from './logger';
import {runMigrations} from "./database/migrations";
import {sleep} from "./utils/sleep";

loggingProvider.log('^2kjmysql has started!^0');

const MySQL = {} as Record<string, Function>;


MySQL.isReady = () => {
    return !!pool;
}

MySQL.awaitConnection = async () => {
    while (!pool) await sleep(0);

    return true;
};

// --- Callback-based Exports ---
// These are the raw functions that other resources will call

MySQL.query = (
    query: string,
    parameters: CFXParameters,
    cb: CFXCallback,
    invokingResource = GetInvokingResource()
) => {
    return rawQuery(null, invokingResource, query, parameters, cb);
};

MySQL.single = (
    query: string,
    parameters: CFXParameters,
    cb: CFXCallback,
    invokingResource = GetInvokingResource()
) => {
    return rawQuery('single', invokingResource, query, parameters, cb);
};

MySQL.scalar = (
    query: string,
    parameters: CFXParameters,
    cb: CFXCallback,
    invokingResource = GetInvokingResource()
) => {
    return rawQuery('scalar', invokingResource, query, parameters, cb);
};

MySQL.insert = (
    query: string,
    parameters: CFXParameters,
    cb: CFXCallback,
    invokingResource = GetInvokingResource()
) => {
    return rawQuery('insert', invokingResource, query, parameters, cb);
};

MySQL.update = (
    query: string,
    parameters: CFXParameters,
    cb: CFXCallback,
    invokingResource = GetInvokingResource()
) => {
    return rawQuery('update', invokingResource, query, parameters, cb);
};

MySQL.transaction = (
    queries: Transaction,
    parameters: CFXParameters,
    cb: CFXCallback,
    invokingResource = GetInvokingResource()
) => {
    return rawTransaction(invokingResource, queries, parameters, cb);
};

MySQL.startTransaction = (
    transactions: () => Promise<boolean>,
    cb: CFXCallback, // Note: The callback is now the 2nd arg
    invokingResource = GetInvokingResource()
) => {
    loggingProvider.warn(`[^3kjmysql^0] MySQL.startTransaction is "experimental" and may receive breaking changes.`);
    return startTransaction(invokingResource, transactions, cb);
};

MySQL.prepare = (
    query: string,
    parameters: CFXParameters,
    cb: CFXCallback,
    invokingResource = GetInvokingResource()
) => {
    return rawExecute(invokingResource, query, parameters, cb);
};

MySQL.rawExecute = (
    query: string,
    parameters: CFXParameters,
    cb: CFXCallback,
    invokingResource = GetInvokingResource()
) => {
    return rawExecute(invokingResource, query, parameters, cb);
};

MySQL.store = (query: string, cb: Function) => {
    if (cb) cb(query);
    return query;
};



// --- Promise-based Async Exports ---
// We create these as a separate object so they can be shared.

const exportedAsyncFunctions = {
    query_async: (query: string, parameters: CFXParameters, invokingResource = GetInvokingResource()): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            MySQL.query(query, parameters, (result: unknown, err: string) => {
                if (err) return reject(new Error(err));
                resolve(result as any[]); // <-- Cast result
            }, invokingResource);
        });
    },
    single_async: (query: string, parameters: CFXParameters, invokingResource = GetInvokingResource()): Promise<any> => {
        return new Promise((resolve, reject) => {
            MySQL.single(query, parameters, (result: unknown, err: string) => {
                if (err) return reject(new Error(err));
                resolve(result as any); // <-- Cast result
            }, invokingResource);
        });
    },
    scalar_async: (query: string, parameters: CFXParameters, invokingResource = GetInvokingResource()): Promise<any> => {
        return new Promise((resolve, reject) => {
            MySQL.scalar(query, parameters, (result: unknown, err: string) => {
                if (err) return reject(new Error(err));
                resolve(result as any); // <-- Cast result
            }, invokingResource);
        });
    },
    insert_async: (query: string, parameters: CFXParameters, invokingResource = GetInvokingResource()): Promise<number> => {
        return new Promise((resolve, reject) => {
            MySQL.insert(query, parameters, (result: unknown, err: string) => {
                if (err) return reject(new Error(err));
                resolve(result as number); // <-- Cast result
            }, invokingResource);
        });
    },
    update_async: (query: string, parameters: CFXParameters, invokingResource = GetInvokingResource()): Promise<number> => {
        return new Promise((resolve, reject) => {
            MySQL.update(query, parameters, (result: unknown, err: string) => {
                if (err) return reject(new Error(err));
                resolve(result as number); // <-- Cast result
            }, invokingResource);
        });
    },
    transaction_async: (queries: Transaction, parameters: CFXParameters, invokingResource = GetInvokingResource()): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            MySQL.transaction(queries, parameters, (result: unknown, err: string) => {
                if (err) return reject(new Error(err));
                resolve(result as boolean); // <-- Cast result
            }, invokingResource);
        });
    },
    startTransaction_async: (queries: () => Promise<boolean>, invokingResource = GetInvokingResource()): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            MySQL.startTransaction(queries, (result: unknown, err: string) => {
                if (err) return reject(new Error(err));
                resolve(result as boolean); // <-- Cast result
            }, invokingResource);
        });
    },
    prepare_async: (query: string, parameters: CFXParameters, invokingResource = GetInvokingResource()): Promise<any> => {
        return new Promise((resolve, reject) => {
            MySQL.prepare(query, parameters, (result: unknown, err: string) => {
                if (err) return reject(new Error(err));
                resolve(result as any); // <-- Cast result
            }, invokingResource);
        });
    },
    rawExecute_async: (query: string, parameters: CFXParameters, invokingResource = GetInvokingResource()): Promise<any> => {
        return new Promise((resolve, reject) => {
            MySQL.rawExecute(query, parameters, (result: unknown, err: string) => {
                if (err) return reject(new Error(err));
                resolve(result as any); // <-- Cast result
            }, invokingResource);
        });
    },
};

// --- Inject Executors into Builder ---
setBuilderExecutors({
    query: (query: string, params: any) => exportedAsyncFunctions.query_async(query, params),
    single: (query: string, params: any) => exportedAsyncFunctions.single_async(query, params),
    insert: (query: string, params: any) => exportedAsyncFunctions.insert_async(query, params),
    update: (query: string, params: any) => exportedAsyncFunctions.update_async(query, params),
});

// --- Create All Global Exports ---

global.exports('setLogger', (provider: Partial<Logger>) => {
    return setLogger(provider);
});

function provide(resourceName: string, method: string, cb: Function) {
    on(`__cfx_export_${resourceName}_${method}`, (setCb: Function) => setCb(cb));
}

// Export all callback-based functions
for (const key in MySQL) {
    const fn = MySQL[key as keyof typeof MySQL];
    global.exports(key, fn);

    // Provide compatibility aliases
    let alias = (ghmatti as any)[key];
    if (alias) {
        provide('ghmattimysql', alias, fn);
    }
    alias = (mysqlAsync as any)[key];
    if (alias) {
        provide('mysql-async', alias, fn);
    }
}

// Export all async-based functions
for (const key in exportedAsyncFunctions) {
    const asyncFn = exportedAsyncFunctions[key as keyof typeof exportedAsyncFunctions];
    global.exports(key, asyncFn);

    // Provide compatibility aliases for ...Sync
    const ghmattiKey = key.replace('_async', '');
    let alias = (ghmatti as any)[ghmattiKey];
    if (alias) {
        provide('ghmattimysql', `${alias}Sync`, asyncFn);
    }
}

global.exports('execute_builder', async (state: any) => {
    if (!state || typeof state.table !== 'string') {
        throw new Error('[kjmysql] Invalid query state object received');
    }

    // Create a REAL KjQuery instance inside the kjmysql resource
    let builder = new KjQuery(state.table);

    // Replay the query from the state object onto the real builder
    switch (state.type) {
        case 'insert':
            builder.insert(state.insertData);
            break;
        case 'update':
            builder.update(state.updateData);
            break;
        case 'delete':
            builder.delete();
            break;
        case 'select':
        default:
            builder.select(...state.fields);

            state.joins.forEach((j: any) => {
                if (j.type === 'LEFT') {
                    builder.leftJoin(j.table, j.field1, j.operator, j.field2);
                } else {
                    builder.join(j.table, j.field1, j.operator, j.field2);
                }
            });

            if (state.groups.length > 0) {
                builder.groupBy(...state.groups);
            }

            state.orders.forEach((o: any) => {
                builder.orderBy(o.field, o.direction);
            });
            break;
    }

    console.log("Adding wheres: ", state.wheres)

    // Add WHERES (applies to select, update, delete)
    state.wheres.forEach((w: any) => {
        builder.where(w.field, w.operator, w.value);
    });

    // Add LIMIT
    if (state.limit !== null) {
        builder.limit(state.limit);
    }

    // --- Execute the now-rebuilt query ---
    try {
        if (state.type === 'select') {
            // .first() set the limit to 1, so we can check that
            if (state.limit === 1) {
                return await builder.first();
            } else {
                return await builder.all();
            }
        } else {
            return await builder.run();
        }
    } catch (e: any) {
        loggingProvider.error(`[^1kjmysql^0] Error executing builder query: ${e.message}`);
        throw e; // Re-throw the error so the calling resource is aware
    }
});

// --- Export Caching Functions ---

async function getOrCache(cacheKey: string, ttl: number, queryFn: () => Promise<any>) {
    const cachedValue = cache.get(cacheKey);
    if (cachedValue) {
        return cachedValue;
    }
    const result = await queryFn();
    if (result !== null && result !== undefined) {
        cache.set(cacheKey, result, ttl);
    }
    return result;
}

global.exports('query_cached', (cacheKey: string, ttl: number, query: string, parameters: CFXParameters) => {
    return getOrCache(cacheKey, ttl, () => exportedAsyncFunctions.query_async(query, parameters));
});

global.exports('single_cached', (cacheKey: string, ttl: number, query: string, parameters: CFXParameters) => {
    return getOrCache(cacheKey, ttl, () => exportedAsyncFunctions.single_async(query, parameters));
});

global.exports('scalar_cached', (cacheKey: string, ttl: number, query: string, parameters: CFXParameters) => {
    return getOrCache(cacheKey, ttl, () => exportedAsyncFunctions.scalar_async(query, parameters));
});

global.exports('clearCache', (cacheKey?: string | string[]) => {
    if (cacheKey) {
        cache.del(cacheKey);
    } else {
        cache.flushAll();
    }
    loggingProvider.log(`^2[kjmysql] Cache cleared: ${cacheKey || 'ALL'}^0`);
});

/**
 * Exports a function to run database migrations for a resource.
 */
global.exports('runMigrations', (resourceName: string, migrationsPath: string) => {
    return runMigrations(resourceName, migrationsPath);
});