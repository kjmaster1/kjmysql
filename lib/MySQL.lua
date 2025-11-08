---@meta kjmysql
---@diagnostic disable: undefined-global

-- This file is for intellisense and is not a functional script
-- Provides autocompletion for Sumneko_Lua and FiveM-Target language servers

---@class MigrationExecutor
---@field query fun(sql: string, values?: any): Promise<any>
---@field execute fun(sql: string, values?: any): Promise<any>

---@alias MigrationUpFunction fun(db: MigrationExecutor): Promise<nil>

---@class Logger
---@field log fun(...)
---@field warn fun(...)
---@field error fun(...)

---@class kjmysql
---@field query fun(query: string, parameters: any, cb: fun(result: any))
---@field single fun(query: string, parameters: any, cb: fun(result: any))
---@field scalar fun(query: string, parameters: any, cb: fun(result: any))
---@field insert fun(query: string, parameters: any, cb: fun(result: number))
---@field update fun(query: string, parameters: any, cb: fun(result: number))
---@field transaction fun(queries: table, parameters: any, cb: fun(result: boolean))
---@field prepare fun(query: string, parameters: any, cb: fun(result: any))
---@field rawExecute fun(query: string, parameters: any, cb: fun(result: any))
---@field startTransaction fun(queries: fun(query: fun(sql: string, values?: any): Promise<any>): Promise<boolean|nil>, cb: fun(result: boolean))

---@field query_async fun(query: string, parameters?: any): Promise<any[]>
---@field single_async fun(query: string, parameters?: any): Promise<any>
---@field scalar_async fun(query: string, parameters?: any): Promise<any>
---@field insert_async fun(query: string, parameters?: any): Promise<number>
---@field update_async fun(query: string, parameters?: any): Promise<number>
---@field transaction_async fun(queries: table, parameters?: any): Promise<boolean>
---@field prepare_async fun(query: string, parameters?: any): Promise<any>
---@field rawExecute_async fun(query: string, parameters?: any): Promise<any>
---@field startTransaction_async fun(queries: fun(query: fun(sql: string, values?: any): Promise<any>): Promise<boolean|nil>): Promise<boolean>

---@field query_cached fun(cacheKey: string, ttl: number, query: string, parameters?: any): Promise<any[]>
---@field single_cached fun(cacheKey: string, ttl: number, query: string, parameters?: any): Promise<any>
---@field scalar_cached fun(cacheKey: string, ttl: number, query: string, parameters?: any): Promise<any>
---@field clearCache fun(cacheKey?: string | string[])

---@field runMigrations fun(resourceName: string, migrationsPath: string): Promise<nil>
---@field table fun(tableName: string): KjQuery
---@field setLogger fun(provider: Logger)

---@class KjQuery
---@field select fun(self: KjQuery, ...: string): KjQuery
---@field where fun(self: KjQuery, field: string, operator: string, value: any): KjQuery
---@field limit fun(self: KjQuery, count: number): KjQuery
---@field insert fun(self: KjQuery, data: table): KjQuery
---@field update fun(self: KjQuery, data: table): KjQuery
---@field delete fun(self: KjQuery): KjQuery
---@field join fun(self: KjQuery, table: string, field1: string, operator: string, field2: string): KjQuery
---@field leftJoin fun(self: KjQuery, table: string, field1: string, operator: string, field2: string): KjQuery
---@field groupBy fun(self: KjQuery, ...: string): KjQuery
---@field orderBy fun(self: KjQuery, field: string, direction?: 'ASC' | 'DESC'): KjQuery
---@field all fun(self: KjQuery): Promise<any[]>
---@field first fun(self: KjQuery): Promise<any>
---@field run fun(self: KjQuery): Promise<number>

---@type kjmysql
exports.kjmysql = {}