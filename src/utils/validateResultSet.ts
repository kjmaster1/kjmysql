import { mysql_resultset_warning } from '../config';
import {QueryResponse} from "../types";

/**
 * Checks if a query result set is larger than the convar limit and warns if so.
 */
export default function (
    invokingResource: string,
    query: string,
    rows: QueryResponse
) {
    const length = Array.isArray(rows) ? rows.length : 0;

    if (length < mysql_resultset_warning) return;

    console.warn(`[^3kjmysql^0] ${invokingResource} executed a query with an oversized result set (${length} results)!\n${query}`);
}