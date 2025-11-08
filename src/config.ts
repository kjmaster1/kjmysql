import type { ConnectionOptions } from 'mysql2';
import * as namedPlaceholders from 'named-placeholders';
import {typeCast} from "./utils/typeCast";
import {loggingProvider} from "./logger";

// Get the connection string from the server convar
export const mysql_connection_string = GetConvar('mysql_connection_string', '');
export const mysql_read_connection_string = GetConvar('mysql_read_connection_string', '');

export let mysql_ui = GetConvar('mysql_ui', 'false') === 'true';
export let mysql_slow_query_warning = GetConvarInt('mysql_slow_query_warning', 200);
export let mysql_debug: boolean | string[] = false;
// Max rows before we warn the user
export let mysql_resultset_warning = GetConvarInt('mysql_resultset_warning', 1000);

export let mysql_log_size = 0;

export let convertNamedPlaceholders: null | ((query: string, parameters: Record<string, any>) => [string, any[]]) = namedPlaceholders.default();

export function setDebug() {

    mysql_ui = GetConvar('mysql_ui', 'false') === 'true';
    mysql_log_size = mysql_debug ? 10000 : GetConvarInt('mysql_log_size', 100);
    mysql_slow_query_warning = GetConvarInt('mysql_slow_query_warning', 200);
    mysql_resultset_warning = GetConvarInt('mysql_resultset_warning', 1000);

    try {
        const debug = GetConvar('mysql_debug', 'false');
        // We can just use a simple boolean for now
        mysql_debug = debug === 'true';
    } catch (e) {
        mysql_debug = true;
    }

    convertNamedPlaceholders = namedPlaceholders.default();
}


/**
 * Parses a connection string (either URI or semicolon) into a mysql2 options object.
 */
function parseConnection(connectionString: string): ConnectionOptions {
    if (!connectionString) {
        throw new Error('Connection string is empty');
    }

    let options: Record<string, any>;

    if (connectionString.includes('mysql://')) {
        const url = new URL(connectionString);
        options = {
            host: url.hostname || 'localhost',
            port: Number(url.port) || 3306,
            user: url.username,
            password: url.password,
            database: url.pathname.substring(1),
        };
    } else {
        options = connectionString
            .replace(/(?:host(?:name)|ip|server|data\s?source|addr(?:ess)?)=/gi, 'host=')
            .replace(/(?:user\s?(?:id|name)?|uid)=/gi, 'user=')
            .replace(/(?:pwd|pass)=/gi, 'password=')
            .replace(/(?:db)=/gi, 'database=')
            .split(';')
            .reduce<Record<string, string>>((connectionInfo, parameter) => {
                const [key, value] = parameter.split('=');
                if (key) connectionInfo[key.trim()] = value;
                return connectionInfo;
            }, {});
    }

    if (!options.database) {
        loggingProvider.warn(`[^3kjmysql^0] No database specified in connection string. This is allowed, but may cause issues.`);
    }

    for (const key of ['dateStrings', 'flags', 'ssl']) {
        const value = options[key];
        if (typeof value === 'string') {
            try {
                options[key] = JSON.parse(value);
            } catch (err) {
                loggingProvider.warn(`^3Failed to parse property ${key} in configuration (${err})!^0`);
            }
        }
    }

    return {
        ...options,
        supportBigNumbers: true,
        jsonStrings: true,
        connectTimeout: 60000,
        trace: false,
        namedPlaceholders: false,
        typeCast: typeCast,
        multipleStatements: true,
    };
}

/**
 * Gets the connection options for the PRIMARY (write) database.
 */
export function getPrimaryConnectionOptions(): ConnectionOptions {
    return parseConnection(mysql_connection_string);
}

/**
 * Gets the connection options for the READ REPLICA database.
 * Returns null if no read string is provided.
 */
export function getReadConnectionOptions(): ConnectionOptions | null {
    if (!mysql_read_connection_string) {
        return null;
    }
    try {
        return parseConnection(mysql_read_connection_string);
    } catch (e: any) {
        console.error(`[^1kjmysql^0] Failed to parse 'mysql_read_connection_string'. Read replica will be disabled. Error: ${e.message}`);
        return null;
    }
}