import type { CFXParameters } from '../types';

// This object will be populated by src/index.ts
let executors = {
    query: (query: string, params: any): Promise<any[]> => Promise.resolve([]),
    single: (query: string, params: any): Promise<any> => Promise.resolve(null),
    insert: (query: string, params: any): Promise<number> => Promise.resolve(0),
    update: (query: string, params: any): Promise<number> => Promise.resolve(0),
};

export function setBuilderExecutors(funcs: typeof executors) {
    executors = funcs;
}

type WhereClause = {
    field: string;
    operator: string;
    value: any;
};

// --- Define new types for our clauses ---
type JoinClause = {
    type: 'INNER' | 'LEFT';
    table: string;
    field1: string;
    operator: string;
    field2: string;
};

type OrderClause = {
    field: string;
    direction: 'ASC' | 'DESC';
};

export class KjQuery {
    private _table: string;
    private _fields: string[] = ['*'];
    private _wheres: WhereClause[] = [];
    private _limit: number | null = null;
    private _params: Record<string, any> = {};
    private _paramCounter = 0;
    private _type: 'select' | 'insert' | 'update' | 'delete' = 'select';
    private _insertData: Record<string, any> | null = null;
    private _updateData: Record<string, any> | null = null;

    private _joins: JoinClause[] = [];
    private _groups: string[] = [];
    private _orders: OrderClause[] = [];

    constructor(tableName: string) {
        this._table = tableName;
    }

    // --- Chainable Methods ---

    public select(...fields: string[]): this {
        if (fields.length > 0) {
            // Handle aliasing (e.g., 'users.name as userName')
            this._fields = fields.map(f => {
                if (f.includes(' as ') || f.includes('*')) return f.trim();
                // Automatically quote fields that aren't aliases or wildcards
                return `\`${f.trim()}\``;
            });
        }
        this._type = 'select';
        return this;
    }

    public where(field: string, operator: string, value: any): this {
        this._wheres.push({ field, operator, value });
        console.log('current state of wheres: ', this._wheres);
        return this;
    }

    public limit(count: number): this {
        this._limit = count;
        return this;
    }

    public insert(data: Record<string, any>): this {
        this._type = 'insert';
        this._insertData = data;
        return this;
    }

    public update(data: Record<string, any>): this {
        this._type = 'update';
        this._updateData = data;
        return this;
    }

    public delete(): this {
        this._type = 'delete';
        return this;
    }

    private _addJoin(type: JoinClause['type'], table: string, field1: string, operator: string, field2: string): this {
        this._joins.push({ type, table, field1, operator, field2 });
        return this;
    }

    public join(table: string, field1: string, operator: string, field2: string): this {
        return this._addJoin('INNER', table, field1, operator, field2);
    }

    public leftJoin(table: string, field1: string, operator: string, field2: string): this {
        return this._addJoin('LEFT', table, field1, operator, field2);
    }

    public groupBy(...fields: string[]): this {
        this._groups.push(...fields.map(f => `\`${f}\``));
        return this;
    }

    public orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
        this._orders.push({ field: `\`${field}\``, direction });
        return this;
    }

    // --- Private Builder ---

    private _addParam(value: any): string {
        const paramName = `param${this._paramCounter++}`;
        this._params[paramName] = value;
        return `@${paramName}`;
    }

    // Helper to quote field names that don't contain functions or table aliases
    private _quoteField(field: string): string {
        if (field.includes('(') || field.includes('`') || field.includes('.')) {
            return field;
        }
        return `\`${field}\``;
    }

    private _buildWhere(): string {
        if (this._wheres.length === 0) {
            return '';
        }
        const clauses = this._wheres.map(clause => {
            const paramName = this._addParam(clause.value);
            return `${this._quoteField(clause.field)} ${clause.operator} ${paramName}`;
        });
        console.log('clauses: ', clauses);
        return ` WHERE ${clauses.join(' AND ')}`;
    }

    private _buildQuery(): [string, Record<string, any>] {
        this._params = {};
        this._paramCounter = 0;

        switch (this._type) {
            case 'insert': {
                if (!this._insertData) throw new Error('INSERT data is missing');
                const fields = Object.keys(this._insertData).map(f => `\`${f}\``).join(', ');
                const paramNames = Object.values(this._insertData).map(v => this._addParam(v)).join(', ');
                const sql = `INSERT INTO \`${this._table}\` (${fields}) VALUES (${paramNames})`;
                return [sql, this._params];
            }

            case 'update': {
                if (!this._updateData) throw new Error('UPDATE data is missing');
                const setClauses = Object.entries(this._updateData).map(([field, value]) => {
                    const paramName = this._addParam(value);
                    return `\`${field}\` = ${paramName}`;
                }).join(', ');

                const whereClause = this._buildWhere();
                if (whereClause === '') {
                    console.warn(`[^3kjmysql^0] UPDATE query on table '${this._table}' has no WHERE clause. This will update all rows.`);
                }

                const sql = `UPDATE \`${this._table}\` SET ${setClauses}${whereClause}`;
                return [sql, this._params];
            }

            case 'delete': {
                const whereClause = this._buildWhere();
                if (whereClause === '') {
                    console.warn(`[^3kjmysql^0] DELETE query on table '${this._table}' has no WHERE clause. This will delete all rows.`);
                }
                const sql = `DELETE FROM \`${this._table}\`${whereClause}`;
                return [sql, this._params];
            }

            case 'select':
            default: {
                const fields = this._fields.join(', ');

                const joinClause = this._joins.map(j =>
                    `${j.type} JOIN \`${j.table}\` ON ${this._quoteField(j.field1)} ${j.operator} ${this._quoteField(j.field2)}`
                ).join(' ');

                const whereClause = this._buildWhere();

                const groupClause = this._groups.length > 0
                    ? ` GROUP BY ${this._groups.join(', ')}`
                    : '';

                const orderClause = this._orders.length > 0
                    ? ` ORDER BY ${this._orders.map(o => `${o.field} ${o.direction}`).join(', ')}`
                    : '';

                const limitClause = this._limit ? ` LIMIT ${this._limit}` : '';

                // Assemble the final query
                const sql = `SELECT ${fields} FROM \`${this._table}\` ${joinClause}${whereClause}${groupClause}${orderClause}${limitClause}`;
                console.log('sql', sql);
                console.log('params', this._params);
                return [sql, this._params];
            }
        }
    }

    // --- Executor Methods ---

    public async all(): Promise<any[]> {
        if (this._type !== 'select') throw new Error('Cannot call .all() on a non-SELECT query');
        const [sql, params] = this._buildQuery();
        console.log('sql', sql);
        console.log('params', params);
        return executors.query(sql, params);
    }

    public async first(): Promise<any> {
        this._limit = 1;
        if (this._type !== 'select') throw new Error('Cannot call .first() on a non-SELECT query');
        const [sql, params] = this._buildQuery();
        return executors.single(sql, params);
    }

    public async run(): Promise<number> {
        if (this._type === 'select') throw new Error('Cannot call .run() on a SELECT query. Use .all() or .first()');

        const [sql, params] = this._buildQuery();

        if (this._type === 'insert') {
            return executors.insert(sql, params);
        } else { // update or delete
            return executors.update(sql, params);
        }
    }
}