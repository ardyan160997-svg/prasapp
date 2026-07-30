import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  var __prastationPool: Pool | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return databaseUrl;
}

export function getPool() {
  if (!globalThis.__prastationPool) {
    globalThis.__prastationPool = new Pool({
      connectionString: getDatabaseUrl(),
    });
  }

  return globalThis.__prastationPool;
}

export async function queryDb<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  return getPool().query<T>(text, values);
}

export async function withTransaction<T>(
  runner: (client: PoolClient) => Promise<T>,
) {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await runner(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
