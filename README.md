# kjmysql

A modern, high-performance MySQL resource for FiveM, built on the foundations of `oxmysql` and extended with powerful new features for scalability, reliability, and developer experience.

`kjmysql` is designed to be a complete, drop-in replacement for `oxmysql`, `mysql-async`, and `ghmattimysql`, while offering a new suite of professional tools that solve common server development challenges.

## Features

`kjmysql` includes several new, powerful features:

-   **Fluent Query Builder:** Write clean, readable, and type-safe queries without raw SQL.
-   **Built-in Caching:** Drastically reduce database load by caching common `SELECT` queries in memory.
-   **Read/Write Splitting:** Scale your server by sending `SELECT` queries to a read replica and all writes (`INSERT`, `UPDATE`) to your primary database.
-   **Database Migrations:** A built-in, automated system for managing schema changes with both `.sql` and `.ts` files.
-   **Real-Time Debug UI:** A live-updating profiler to watch your queries as they happen, not just a static snapshot.
-   **Pluggable Logger:** Redirect all database logs (errors, slow queries) to any service you want, such as Discord, Sentry, or Fivemanage.
-   **Full Compatibility:** Drop-in replacement for `mysql-async` and `ghmattimysql`.
-   **High Performance:** Built on `node-mysql2` with support for prepared statements (`execute`).

## Installation

1.  Download the latest `kjmysql.zip` from the [GitHub Releases](https://github.com/kjmaster1/kjmysql/releases) page.
2.  Unzip the folder and place it in your server's `resources` directory.
3.  Ensure `kjmysql` starts *before* any resource that depends on it in your `server.cfg`:

```cfg
ensure kjmysql
# ... your other resources
```

## Configuration (Convars)

| Convar                         | Default   | Description                                                                                                    |
| ------------------------------ | --------- | -------------------------------------------------------------------------------------------------------------- |
| `mysql_connection_string`        | `""`        | **Required.** Your primary database connection string (URI or semicolon-separated).                            |
| `mysql_read_connection_string` | `""`        | **Optional.** A separate connection string for a read-only replica. If set, all `SELECT` queries will go here. |
| `mysql_debug`                    | `"false"` | Set to `"true"` to print all queries to the console and enable the advanced profiler.                          |
| `mysql_slow_query_warning`       | `200`       | The time (in ms) before a query is logged as "slow".                                                           |
| `mysql_ui`                       | `"false"`   | Set to `"true"` to enable the `/mysql` debug command for in-game profiling.                                    |
| `mysql_versioncheck`             | `"true"`    | Set to `"false"` to disable the automatic update checker.                                                      |

## For Developers

`kjmysql` provides an API for both Lua and TypeScript/JS developers.

### Developer Setup (TypeScript/JS)

Use raw exports or install the npm package for intellisense

```bash
# In your resource's folder
pnpm add @kjmaster2/kjmysql
```

Import the kjmysql object into your resource.

```typescript
import { kjmysql as MySQL } from '@kjmaster2/kjmysql'
```

### Developer Setup (Lua)

Modify `fxmanifest.lua` for your resource, and add the following above any other script files.

```lua
server_script '@kjmysql/lib/MySQL.lua'
```

### Basic Async Queries (Raw SQL)

Using promise-based async functions is recommended.

```typescript
async function getPlayer(id: number) {
  // Use named placeholders for security
  const result = await exports.kjmysql.single_async('SELECT * FROM users WHERE id = @id', {
    id: id
  });
  
  if (result) {
    console.log(result.name);
  }
}

async function createPlayer(id: number, name: string) {
  // .insert_async returns the insert ID
  const insertId = await exports.kjmysql.insert_async(
    'INSERT INTO users (id, name) VALUES (@id, @name)',
    { id, name }
  );
  
  // .update_async returns the number of affected rows
  const affectedRows = await exports.kjmysql.update_async(
    'UPDATE users SET name = @name WHERE id = @id',
    { name: 'New Name', id }
  );

  return insertId;
}
```

## Advanced Features

### 1. The Query Builder

Stop writing raw SQL strings! The query builder provides a clean, chainable, and type-safe way to build queries.

- `table(tableName)`: Start a new query.
- `.select(...fields)`: Specify columns.
- `.where(field, op, value)`: Add a `WHERE` clause.
- `.join(table, f1, op, f2)`: Add an `INNER JOIN`.
- `.leftJoin(table, f1, op, f2)`: Add a `LEFT JOIN`.
- `.groupBy(...fields)`: Add a `GROUP BY` clause.
- `.orderBy(field, dir)`: Add an `ORDER BY` clause.
- `.limit(count)`: Add a `LIMIT` clause.
- `.insert(data)`: Create an `INSERT` query.
- `.update(data)`: Create an `UPDATE` query.
- `.delete()`: Create a `DELETE` query.
- `.first()`: Executes the `SELECT` query and returns one row.
- `.all()`: Executes the `SELECT` query and returns all rows.
- `.run()`: Executes an `INSERT`, `UPDATE`, or `DELETE` query.

Example: Get a player's name and their first 5 items, sorted by name.

```typescript
import { KjQuery } from '@kjmaster2/kjmysql';

async function getPlayerInventory(playerId: number) {
  const qb: KjQuery = exports.kjmysql.table('users');

  const items = await qb
    .select('users.name', 'items.name as itemName', 'items.count')
    .join('items', 'items.owner', '=', 'users.identifier')
    .where('users.id', '=', playerId)
    .orderBy('itemName', 'ASC')
    .limit(5)
    .all();

  // items = [
  //   { name: 'PlayerName', itemName: 'Bread', count: 5 },
  //   { name: 'PlayerName', itemName: 'Water', count: 2 }
  // ]
  return items;
}
```

### 2. Built-in Caching

```typescript
// This query will only run ONCE every 10 minutes (600 seconds).
// All other calls in that 10-minute window will get the
// cached result instantly, without touching the database.

const shopItems = await exports.kjmysql.query_cached(
  'shop:main', // A unique cache key
  600,         // Time-to-live in seconds
  'SELECT * FROM items WHERE shop = @shop',
  { shop: 'main' }
);
```
You can manually clear the cache when you update the data:

```typescript
// Clear a specific key
exports.kjmysql.clearCache('shop:main');

// Or flush the entire cache
exports.kjmysql.clearCache();
```

### 3. Database Migrations

Automate your database schema changes safely and reliably. `kjmysql` provides an export to run migration files from your resource's folder.

- Create a `migrations` folder in your resource (e.g., `my-script/migrations`).
- Create your migration files with a numbered prefix (e.g., `001_create_users.sql`, `002_add_job_column.ts`).
- Call the export when your resource starts.

```typescript
// my-script/server.ts

on('onResourceStart', (resourceName: string) => {
  if (resourceName !== GetCurrentResourceName()) return;

  // Run all pending migrations
  exports.kjmysql.runMigrations(
    GetCurrentResourceName(),
    GetResourcePath(GetCurrentResourceName()) + '/migrations'
  );
});
```
`kjmysql` can run `.sql` and `.ts` migrations.

#### SQL Migration: `001_create_users.sql`

```sql
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `identifier` VARCHAR(50) NOT NULL,
  `name` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```
#### Typescript Migration: `002_convert_data.ts`

TypeScript migrations are for complex data changes. They must export an `async function up(db)`.

```typescript
import type { MigrationExecutor } from '@kjmaster2/kjmysql';

export async function up(db: MigrationExecutor) {
  console.log('Running TS migration: 002_update_users.ts');
  
  await db.query("ALTER TABLE `users` ADD COLUMN `new_job_label` VARCHAR(50)");
  
  const [users] = await db.query("SELECT id, old_job_id FROM users WHERE old_job_id IS NOT NULL");
  
  for (const user of users) {
    const newLabel = `job_${user.old_job_id}`;
    await db.execute("UPDATE users SET new_job_label = ? WHERE id = ?", [newLabel, user.id]);
  }
}
```

### 4. Pluggable Logger

By default, all errors and slow queries are printed to the console. You can override this to send logs to Discord, Sentry, or any other service.

```lua
-- my-logger/server.lua
-- Must start BEFORE kjmysql (use load_before 'kjmysql')

exports.kjmysql:setLogger({
  log = function(...) print(...) end, -- Keep default log
  warn = function(...) print(...) end, -- Keep default warn
  error = function(message)
    print(message) -- Print to console AND send to Discord
    sendErrorToDiscord(message)
  end
})

local function sendErrorToDiscord(message)
    -- Your webhook logic here
end
```

### 5. Real-Time Debug UI

The debug UI is a real-time profiler.

- Set `set mysql_ui "true"` in your `server.cfg`.
- Give yourself permission: `add_ace group.admin command.mysql allow`.
- Run `/mysql` in-game.

The UI will open, and you can watch queries appear on the dashboard and resource-specific pages as they are executed on the server.

## Credits

- **oxmysql**: This project is based on the solid foundation and architecture of [oxmysql](https://github.com/communityox/oxmysql) by the Overextended team.
- **node-mysql2**: The fast, reliable Node.js driver that powers this resource.