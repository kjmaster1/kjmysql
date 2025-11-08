import NodeCache from 'node-cache';

/**
 * Global cache instance.
 * stdTTL: 600 (10 minutes) default Time-To-Live for all keys.
 * checkperiod: 120 (2 minutes) how often to check for expired keys.
 */
export const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

console.log('^2[kjmysql] Cache module initialized.^0');