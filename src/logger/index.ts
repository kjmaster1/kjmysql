import {mysql_debug, mysql_log_size, mysql_slow_query_warning, mysql_ui} from '../config';
import type { CFXCallback, CFXParameters } from '../types';
import { dbVersion } from '../database';

/**
 * Defines the shape of a logging provider.
 * Any object with log, warn, and error methods will match.
 */
export interface Logger {
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
}

/**
 * The global logging provider.
 * Defaults to the console, but can be replaced by exports.setLogger
 */
export let loggingProvider: Logger = console;

/**
 * Allows other resources to override the logging system.
 * Merges with console to ensure all methods are present.
 * @param provider A partial logger object
 */
export function setLogger(provider: Partial<Logger>) {
    loggingProvider = { ...console, ...provider };
    loggingProvider.log('^2[kjmysql] Logging provider has been set.^0');
}

const uiActivePlayers = new Set<number>();

/**
 * A standardized error logger.
 *
 */
export function logError(
    invokingResource: string,
    cb: CFXCallback | undefined,
    err: any | string = '',
    query?: string,
    parameters?: CFXParameters
) {
    const message = typeof err === 'object' ? err.message : err.replace(/SCRIPT ERROR: citizen:[\w\/\.]+:\d+[:\s]+/, '');

    const output = `[^1kjmysql^0] ${invokingResource} was unable to execute a query!${query ? `\nQuery: ${query}` : ''}${
        parameters ? `\nParams: ${JSON.stringify(parameters)}` : ''
    }\n${message}`;

    if (cb) {
        try {
            return cb(null, output); // Send error to callback
        } catch (e) {}
    }

    loggingProvider.error(output);
}

interface QueryData {
    date: number;
    query: string;
    executionTime: number;
    slow?: boolean;
}

type QueryLog = Record<string, QueryData[]>;

const logStorage: QueryLog = {};

/**
 * Logs a query, checking if it's a slow query or if debug is on.
 *
 */
export const logQuery = (
    invokingResource: string,
    query: string,
    executionTime: number,
    parameters?: CFXParameters
) => {
    if (
        executionTime >= mysql_slow_query_warning ||
        mysql_debug
    ) {
        (executionTime >= mysql_slow_query_warning ? loggingProvider.warn : loggingProvider.log)(
            `${dbVersion} ^3${invokingResource} took ${executionTime.toFixed(4)}ms to execute a query!\n${query}${
                parameters ? ` ${JSON.stringify(parameters)}` : ''
            }^0`
        );
    }

    if (!mysql_ui) return;

    const newQueryData = {
        query,
        executionTime,
        date: Date.now(),
        slow: executionTime >= mysql_slow_query_warning ? true : undefined,
    };

    if (!logStorage[invokingResource]) {
        logStorage[invokingResource] = [];
    }

    logStorage[invokingResource].push(newQueryData);

    if (uiActivePlayers.size > 0) {
        const pushData = { resource: invokingResource, ...newQueryData };
        for (const playerSource of uiActivePlayers) {
            emitNet('kjmysql:pushQuery', playerSource, pushData);
        }
    }
};

/**
 * Command to open the UI
 *
 */
RegisterCommand(
    'mysql',
    (source: number) => {
        console.log(mysql_ui)
        if (!mysql_ui) return;
        if (source < 1) return loggingProvider.log('^3This command cannot run server side^0');

        let totalQueries: number = 0;
        let totalTime = 0;
        let slowQueries = 0;
        let chartData: { labels: string[]; data: { queries: number; time: number }[] } = { labels: [], data: [] };

        for (const resource in logStorage) {
            const queries = logStorage[resource];
            let totalResourceTime = 0;

            totalQueries += queries.length;
            totalTime += queries.reduce((total, query) => (total += query.executionTime), 0);
            slowQueries += queries.reduce((total, query) => (total += query.slow ? 1 : 0), 0);
            totalResourceTime += queries.reduce((total, query) => (total += query.executionTime), 0);
            chartData.labels.push(resource);
            chartData.data.push({ queries: queries.length, time: totalResourceTime });
        }

        emitNet(`kjmysql:openUi`, source, {
            resources: Object.keys(logStorage),
            totalQueries,
            slowQueries,
            totalTime,
            chartData,
        });

        uiActivePlayers.add(source);
    },
    true
);

/**
 * Helper to sort queries for the UI
 *
 */
const sortQueries = (queries: QueryData[], sort: { id: 'query' | 'executionTime'; desc: boolean }) => {
    const sortedQueries = [...queries].sort((a, b) => {
        switch (sort.id) {
            case 'query':
                return a.query > b.query ? 1 : -1;
            case 'executionTime':
                return a.executionTime - b.executionTime;
            default:
                return 0;
        }
    });

    return sort.desc ? sortedQueries.reverse() : sortedQueries;
};

/**
 * Network event for the UI to fetch data
 *
 */
onNet(
    `kjmysql:fetchResource`,
    (data: {
        resource: string;
        pageIndex: number;
        search: string;
        sortBy?: { id: 'query' | 'executionTime'; desc: boolean }[];
    }) => {
        const source = global.source;
        if (typeof data.resource !== 'string' || !IsPlayerAceAllowed(source.toString(), 'command.mysql')) return;

        if (data.search) data.search = data.search.toLowerCase();

        const resourceLog = data.search
            ? logStorage[data.resource].filter((q) => q.query.toLowerCase().includes(data.search))
            : logStorage[data.resource];

        if (!resourceLog) return;

        const sort = data.sortBy && data.sortBy.length > 0 ? data.sortBy[0] : false;
        const startRow = data.pageIndex * 10;
        const endRow = startRow + 10;
        const queries = sort ? sortQueries(resourceLog, sort).slice(startRow, endRow) : resourceLog.slice(startRow, endRow);
        const pageCount = Math.ceil(resourceLog.length / 10);

        if (!queries) return;

        let resourceTime = 0;
        let resourceSlowQueries = 0;
        const resourceQueriesCount = resourceLog.length;

        for (let i = 0; i < resourceQueriesCount; i++) {
            const query = resourceLog[i];
            resourceTime += query.executionTime;
            if (query.slow) resourceSlowQueries += 1;
        }

        emitNet(`kjmysql:loadResource`, source, {
            queries,
            pageCount,
            resourceQueriesCount,
            resourceSlowQueries,
            resourceTime,
        });
    }
);

onNet('kjmysql:uiClosed', () => {
    const source = global.source;
    if (source) {
        uiActivePlayers.delete(source);
    }
});