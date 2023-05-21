import initSqlJs from 'sql.js';
import { apply, diff, prepare } from '../src/mod';
import { toHex } from './utils/hex';

test('SQLite test(id, name)', async () => {
  const sqlJs = await initSqlJs();

  // create empty database
  const sourceDb1 = new sqlJs.Database(new Uint8Array(0));
  // Create schema and insert data
  sourceDb1.exec(`CREATE TABLE test (id TEXT PRIMARY KEY, name TEXT);`);
  sourceDb1.exec(`INSERT INTO test VALUES ('abcd', 'foo');`);

  // Sync database
  const sourceFile1 = sourceDb1.export().buffer;
  const targetFile1 = new ArrayBuffer(0); // target is empty
  const targetChecksum1 = prepare(targetFile1);

  // Create patch
  const patch1 = diff(sourceFile1, targetChecksum1);

  // Apply patch
  const targetFile2 = apply(targetFile1, patch1);

  // up to date
  expect(toHex(prepare(sourceFile1))).toEqual(toHex(prepare(targetFile2)));
  expect(toHex(sourceFile1)).toEqual(toHex(targetFile2));

  const targetDb1 = new sqlJs.Database(new Uint8Array(targetFile2));

  // Check data
  const result = targetDb1.exec(`SELECT * FROM test;`);
  expect(result).toEqual([{ columns: ['id', 'name'], values: [['abcd', 'foo']] }]);

  // Insert more data
  sourceDb1.exec(`INSERT INTO test VALUES ('efgh', 'bar');`);

  // Sync database
  const sourceFile2 = sourceDb1.export().buffer;
  const patch2 = diff(sourceFile2, prepare(sourceFile1));

  expect(toHex(apply(sourceFile1, patch2))).toEqual(toHex(sourceFile2));

  // Apply patch
  const targetFile3 = apply(targetFile2, patch2);
  // up to date
  expect(toHex(prepare(targetFile3))).toEqual(toHex(prepare(sourceFile2)));

  const targetDb2 = new sqlJs.Database(new Uint8Array(targetFile3));

  // Check data
  const result2 = targetDb2.exec(`SELECT * FROM test;`);
  expect(result2).toEqual([
    {
      columns: ['id', 'name'],
      values: [
        ['abcd', 'foo'],
        ['efgh', 'bar'],
      ],
    },
  ]);
});
