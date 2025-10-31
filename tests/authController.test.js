import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  login,
  __setAuthDependencies,
  __resetAuthDependencies,
} from "../src/controllers/authController.js";

const createMockResponse = () => {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
};

const originalSecret = process.env.JWT_SECRET;

afterEach(() => {
  __resetAuthDependencies();
  if (originalSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalSecret;
  }
});

test("login siswa mengembalikan nis dari data students", async () => {
  process.env.JWT_SECRET = "test-secret";

  const userRecord = {
    id: 5,
    username: "siswa",
    password: "rahasia",
    role: "siswa",
    email: "siswa@example.com",
    createdAt: "2024-01-01T00:00:00.000Z",
  };

  const studentRecord = {
    id: 3,
    userId: 5,
    nis: "55667788",
    nisn: "11223344",
    kelasId: 7,
    nama: "Siswa Contoh",
  };

  const fakeDb = (table) => {
    if (table === "users") {
      return {
        where: (criteria) => {
          assert.deepEqual(criteria, {
            username: "siswa",
            password: "rahasia",
            role: "siswa",
          });
          return {
            first: async () => userRecord,
          };
        },
      };
    }

    if (table === "students") {
      return {
        where: (criteria) => {
          assert.equal(criteria.userId, userRecord.id);
          return {
            first: async () => studentRecord,
          };
        },
      };
    }

    throw new Error(`Unexpected table requested: ${table}`);
  };

  __setAuthDependencies({ db: fakeDb });

  const req = {
    body: { username: "siswa", password: "rahasia", role: "siswa" },
  };
  const res = createMockResponse();

  await login(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.user.nis, "55667788");
  assert.equal(res.body.data.user.nisn, "11223344");
});
