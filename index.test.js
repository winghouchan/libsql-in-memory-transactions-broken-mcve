const { createClient } = require('@libsql/client');
const assert = require('node:assert');
const test = require('node:test');

/**
 * Applies the test fixture to the database
 */
async function applyFixture(database) {
  return await database.execute(`CREATE TABLE t (c);`);
}

/**
 * Returns the tables of the given database
 */
async function getTables(database) {
  return await database.execute(
    `SELECT name FROM sqlite_master WHERE type = 'table'`
  );
}

/**
 * No operation transaction
 *
 * A transaction that doesn't do anything
 */
async function noopTransaction(database) {
  (await database.transaction()).close();
}

test('Database tables should be the same before and after a transaction', async () => {
  const database = createClient({ url: 'file::memory:' });

  await applyFixture(database);

  const expected = await getTables(database);

  await noopTransaction(database);

  const actual = await getTables(database);

  database.close();

  assert.deepEqual(actual, expected);
});

test('Database tables should not be the same between in-memory databases with a shared cache after the first database is closed', async () => {
  const database = createClient({ url: 'file::memory:?cache=shared' });

  await applyFixture(database);

  const database1Tables = await getTables(database);

  await noopTransaction(database);

  database.close();

  const database2 = createClient({ url: 'file::memory:?cache=shared' });

  const database2Tables = await getTables(database2);

  database2.close();

  assert.notDeepEqual(database2Tables, database1Tables);
});
