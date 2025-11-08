import type { CFXParameters } from '../types';
import {convertNamedPlaceholders} from "../config";

export const parseArguments = (query: string, parameters?: CFXParameters): [string, CFXParameters] => {
    if (typeof query !== 'string') {
        throw new Error(`Expected query to be a string but received ${typeof query} instead.`);
    }

    if (convertNamedPlaceholders && parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        if (query.includes(':') || query.includes('@')) {
            [query, parameters] = convertNamedPlaceholders(query, parameters);
        }
    }

    if (!parameters || typeof parameters === 'function') {
        parameters = [];
    }

    const placeholders = query.match(/\?(?!\?)/g)?.length ?? 0;

    if (Array.isArray(parameters)) { // Ensure it's an array now
        if (parameters.length < placeholders) {
            // Autofill missing parameters with null
            for (let i = parameters.length; i < placeholders; i++) {
                parameters.push(null);
            }
        } else if (parameters.length > placeholders) {
            throw new Error(`Expected ${placeholders} parameters, but received ${parameters.length}.`);
        }
    } else if (placeholders > 0) {
        // This should not happen if named placeholders were used, so it's an error.
        throw new Error(`Query has ${placeholders} placeholders (?), but parameters are not an array.`);
    }

    return [query, parameters];
};