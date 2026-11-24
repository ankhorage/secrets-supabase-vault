import { expect, test } from 'bun:test';

import { createBunSupabaseVaultSqlClient } from './createBunSupabaseVaultSqlClient.js';

test('rejects a blank database URL before opening a trusted Vault connection', () => {
  expect(() => createBunSupabaseVaultSqlClient('   ')).toThrow(
    'Supabase Vault requires a trusted PostgreSQL database URL.',
  );
});
