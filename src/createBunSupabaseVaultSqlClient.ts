import { SQL } from 'bun';

import type { SupabaseVaultQueryResult, SupabaseVaultSqlClient } from './types.js';

/*** Create a Bun server-side PostgreSQL client for trusted Supabase Vault adapter composition. */
export function createBunSupabaseVaultSqlClient(databaseUrl: string): SupabaseVaultSqlClient {
  const url = requireDatabaseUrl(databaseUrl);
  const sql = new SQL(url, { adapter: 'postgres', connectionTimeout: 10, max: 4 });

  return {
    query: (statement, parameters = []) => queryAsync(sql, statement, parameters),
    transaction: (operation) =>
      sql.begin((transaction) =>
        operation({
          query: (statement, parameters = []) => queryAsync(transaction, statement, parameters),
        }),
      ),
  };
}

/*** Execute one parameterized Vault query and expose only record-shaped result rows. */
async function queryAsync<TRow extends Record<string, unknown>>(
  executor: { unsafe(statement: string, parameters: readonly unknown[]): Promise<unknown> },
  statement: string,
  parameters: readonly unknown[],
): Promise<SupabaseVaultQueryResult<TRow>> {
  const rows = await executor.unsafe(statement, parameters);
  if (!Array.isArray(rows) || !rows.every(isRecord)) {
    throw new Error('Supabase Vault query returned an unexpected result shape.');
  }
  return { rows: rows as readonly TRow[] };
}

/*** Require an explicit server-only PostgreSQL URL and reject blank configuration before connecting. */
function requireDatabaseUrl(value: string): string {
  const url = value.trim();
  if (url.length === 0)
    throw new TypeError('Supabase Vault requires a trusted PostgreSQL database URL.');
  return url;
}

/*** Recognize a row object returned by Bun's PostgreSQL adapter. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
