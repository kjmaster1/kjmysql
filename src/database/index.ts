import { sleep } from '../utils/sleep';
import { pool, readPool, createPrimaryPool, createReadPool } from './pool';
import {setDebug} from "../config";

// This loop attempts to connect to the database.
// If it fails, it waits 30 seconds before trying again.
setTimeout(async () => {
    setDebug();

    // 1. Loop until the PRIMARY pool is connected
    while (!pool) {
        await createPrimaryPool();

        if (!pool) {
            console.error('^1[Primary] Connection failed. Retrying in 30 seconds...^0');
            await sleep(30000);
        }
    }

    // 2. Once primary is ready, create the read pool (it falls back to primary on its own)
    await createReadPool();
});

setInterval(() => {
    setDebug();
}, 1000);

export * from './pool';
export * from './connection'
export * from './rawQuery'
export * from './rawTransaction'
export * from './rawExecute'
export * from './startTransaction'