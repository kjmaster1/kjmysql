import type { TypeCastField, TypeCastNext } from 'mysql2/promise';

const BINARY_CHARSET = 63;

/**
 * Type caster for prepared statements (execute).
 * node-mysql2 v3.9.0+ requires this for DATETIME fields.
 *
 */
export function typeCastExecute(field: TypeCastField, next: TypeCastNext) {
    switch (field.type) {
        case 'DATETIME':
        case 'DATETIME2':
        case 'TIMESTAMP':
        case 'TIMESTAMP2':
        case 'NEWDATE': {
            const value = field.string();
            return value ? new Date(value).getTime() : null;
        }
        case 'DATE': {
            const value = field.string();
            return value ? new Date(value + ' 00:00:00').getTime() : null;
        }
        default:
            return next();
    }
}

/**
 * Main type caster for .query()
 * Converts dates to timestamps and TINYINT(1) to booleans.
 *
 */
export function typeCast(field: TypeCastField, next: TypeCastNext) {
    switch (field.type) {
        case 'DATETIME':
        case 'DATETIME2':
        case 'TIMESTAMP':
        case 'TIMESTAMP2':
        case 'NEWDATE': {
            const value = field.string();
            return value ? new Date(value).getTime() : null;
        }
        case 'DATE': {
            const value = field.string();
            return value ? new Date(value + ' 00:00:00').getTime() : null;
        }
        // Handle TINYINT(1) as boolean
        case 'TINY':
            return field.length === 1 ? field.string() === '1' : next();
        // Handle BIT(1) as boolean
        case 'BIT':
            return field.length === 1 ? field.buffer()?.[0] === 1 : field.buffer()?.[0];
        case 'TINY_BLOB':
        case 'MEDIUM_BLOB':
        case 'LONG_BLOB':
        case 'BLOB':
            if (field.charset === BINARY_CHARSET) {
                const value = field.buffer();
                if (value === null) return [value];
                return [...value]; // Convert Buffer to byte array
            }
            return field.string();
        default:
            return next();
    }
}