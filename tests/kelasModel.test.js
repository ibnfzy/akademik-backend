import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  createClass,
  updateClass,
  __setDb,
  __resetDb,
} from "../src/models/kelas.js";

const createMockDb = (initialRows = []) => {
  let rows = initialRows.map((row) => ({ ...row }));
  let nextId =
    rows.reduce((highest, row) => (row.id > highest ? row.id : highest), 0) + 1;

  const cloneRows = () => rows.map((row) => ({ ...row }));

  const buildQuery = (tableName) => {
    if (tableName !== "classes") {
      throw new Error(`Tabel ${tableName} tidak didukung dalam mock`);
    }

    let filters = null;

    const applyFilters = () => {
      if (!filters) {
        return rows;
      }

      return rows.filter((row) => {
        return Object.entries(filters).every(([key, value]) => row[key] === value);
      });
    };

    const pickColumns = (row, columns) => {
      if (columns.length === 0 || (columns.length === 1 && columns[0] === "*")) {
        return { ...row };
      }

      return columns.reduce((acc, column) => {
        acc[column] = row[column];
        return acc;
      }, {});
    };

    return {
      where(condition) {
        filters = condition;
        return this;
      },
      select(...columns) {
        const data = applyFilters().map((row) => pickColumns(row, columns));
        return Promise.resolve(data);
      },
      first() {
        const row = applyFilters()[0];
        return Promise.resolve(row ? { ...row } : undefined);
      },
      insert(payload) {
        const newRow = { id: nextId++, ...payload };
        rows.push(newRow);
        return Promise.resolve([newRow.id]);
      },
      update(payload) {
        rows = rows.map((row) => {
          if (
            filters &&
            Object.entries(filters).every(([key, value]) => row[key] === value)
          ) {
            return { ...row, ...payload };
          }

          return row;
        });

        return Promise.resolve();
      },
    };
  };

  const mockDb = (tableName) => buildQuery(tableName);

  mockDb.transaction = async (handler) => {
    const trx = (tableName) => buildQuery(tableName);
    return handler(trx);
  };

  mockDb._getRows = () => cloneRows();

  return mockDb;
};

beforeEach(() => {
  __resetDb();
});

afterEach(() => {
  __resetDb();
});

test("createClass menghitung nama kelas secara berurutan", async () => {
  const mockDb = createMockDb([
    { id: 1, nama: "10 IPA 1", tingkat: "10", jurusan: "IPA", walikelasId: 1 },
    { id: 2, nama: "10 IPA 2", tingkat: "10", jurusan: "IPA", walikelasId: 2 },
  ]);

  __setDb(mockDb);

  const result = await createClass({ tingkat: "10", jurusan: "IPA" });

  assert.equal(result.nama, "10 IPA 3");
  assert.equal(result.tingkat, "10");
  assert.equal(result.jurusan, "IPA");
});

test("updateClass memberikan nama baru ketika kombinasi berubah", async () => {
  const mockDb = createMockDb([
    { id: 1, nama: "10 IPA 1", tingkat: "10", jurusan: "IPA", walikelasId: 1 },
    { id: 2, nama: "10 IPA 2", tingkat: "10", jurusan: "IPA", walikelasId: 2 },
    { id: 3, nama: "11 IPA 1", tingkat: "11", jurusan: "IPA", walikelasId: 3 },
  ]);

  __setDb(mockDb);

  const updated = await updateClass(2, { tingkat: "11" });

  assert.equal(updated.nama, "11 IPA 2");
  assert.equal(updated.tingkat, "11");
  assert.equal(updated.jurusan, "IPA");

  const rows = mockDb._getRows();
  const movedClass = rows.find((row) => row.id === 2);
  assert.equal(movedClass.nama, "11 IPA 2");
});

test("updateClass mempertahankan nama ketika kombinasi sama", async () => {
  const mockDb = createMockDb([
    { id: 1, nama: "12 IPS 1", tingkat: "12", jurusan: "IPS", walikelasId: 4 },
  ]);

  __setDb(mockDb);

  const updated = await updateClass(1, { walikelasId: 10 });

  assert.equal(updated.nama, "12 IPS 1");
  assert.equal(updated.walikelasId, 10);
});
